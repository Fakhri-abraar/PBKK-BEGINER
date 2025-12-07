// test/app.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common'; 
import { default as request } from 'supertest'; 
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';
import * as bcrypt from 'bcryptjs'; 
import { AuthService } from './../src/auth/auth.service';
import { ConfigModule } from '@nestjs/config'; 
import * as fs from 'fs'; // Diperlukan untuk tes File Upload
import * as path from 'path'; // Diperlukan untuk tes File Upload

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

  // Data user standar
  const testUser = {
    username: 'testuser',
    password: 'password123',
    email: 'testuser@example.com',
  };
  const anotherUser = {
    username: 'anotheruser',
    password: 'password123',
    email: 'anotheruser@example.com',
  };

  let testAccessToken: string;
  let anotherUserToken: string; 
  let testCategoryId: string; 
  let testTaskId: string | null = null; 
  
  // Variabel untuk File Upload
  const dummyFilePath = path.join(__dirname, 'dummy-test-file.txt'); 
  let specificTaskId: string; // ID untuk tes Search/Pagination

  // --- 1. SETUP & TEARDOWN ---

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            JWT_SECRET: 'super-secret-testing-key-for-e2e', 
          })],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1'); 
    
    // Pasang Global Validation Pipe (FIX untuk 400 Bad Request)
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);

    // Hapus semua data untuk isolasi tes
    await prisma.task.deleteMany(); 
    await prisma.category.deleteMany(); 
    await prisma.user.deleteMany();

    // Buat user baru 
    await prisma.user.createMany({
      data: [
        { username: testUser.username, password: await bcrypt.hash(testUser.password, 10), email: testUser.email },
        { username: anotherUser.username, password: await bcrypt.hash(anotherUser.password, 10), email: anotherUser.email },
      ],
    });

    // Login dan dapatkan token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: testUser.username, password: testUser.password })
      .expect(201); 
    testAccessToken = loginResponse.body.access_token;
    
    const anotherLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: anotherUser.username, password: anotherUser.password })
      .expect(201);
    anotherUserToken = anotherLoginResponse.body.access_token;
    
    // --- SETUP FILE UPLOAD ---
    // 1. Buat file dummy sebelum semua tes berjalan
    fs.writeFileSync(dummyFilePath, 'This is a test file for upload.'); 
  });
  
  afterAll(async () => {
    // 1. Hapus file dummy
    if (fs.existsSync(dummyFilePath)) {
        fs.unlinkSync(dummyFilePath);
    }
    // 2. Tutup aplikasi
    await app.close();
  });


  // --- 2. AUTHENTICATION & AUTHORIZATION TESTS ---
  
  it('/auth/register (POST) should register a new user successfully (201)', async () => {
      const newUser = { username: 'brandnewuser', password: 'newpassword', email: 'new@example.com' };
      
      await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(newUser)
          .expect(201);
          
      await prisma.user.delete({ where: { username: newUser.username } });
  });

  it('/tasks (POST) should fail with 401 if no token is provided (Unauthorized)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .send({ title: 'Forbidden Task', priority: 'low', categoryId: 'dummy' })
      .expect(401);
  });

  // --- 3. CATEGORY CRUD ---

  it('/categories (POST) should create a category (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({ name: 'Work' })
      .expect(201);
    
    expect(response.body.name).toBe('Work');
    testCategoryId = response.body.id;
  });

  // --- 4. TASK CRUD (Success & Failure) ---

  it('/tasks (POST) should create a task successfully (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({
        title: 'Complete NestJS Project',
        description: 'Finish all CRUD operations and deploy',
        priority: 'high',
        categoryId: testCategoryId,
        isPublic: true,
      })
      .expect(201);

    expect(response.body.title).toBe('Complete NestJS Project');
    testTaskId = response.body.id;
  });

  it('/tasks (POST) should fail with 400 for invalid data (missing title)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({
        description: 'Test invalid data',
        priority: 'high',
        categoryId: testCategoryId,
      })
      .expect(400); 
  });


  it('/tasks (GET) should retrieve owner tasks (200)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tasks') // Mengambil tasks milik user yang login
      .set('Authorization', `Bearer ${testAccessToken}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0); 
    expect(response.body.data.some(task => task.id === testTaskId)).toBe(true); 
  });
  
  it('/tasks/public (GET) should retrieve public tasks (200)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tasks/public')
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.some(task => task.isPublic === true)).toBe(true);
  });

  it('/tasks/:id (GET) should fail with 404 for non-existent ID', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/tasks/non-existent-id-123`)
      .set('Authorization', `Bearer ${testAccessToken}`)
      .expect(404);
  });


  it('/tasks/:id (PATCH) should update a task as owner (200)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({ title: 'Completed NestJS Project Update', isCompleted: true })
      .expect(200);

    expect(response.body.title).toBe('Completed NestJS Project Update');
    expect(response.body.isCompleted).toBe(true);
  });

  // Menguji hak akses (403/404)
  it('/tasks/:id (PATCH) should fail with 404 when a non-owner tries to update', async () => {
    const taskResponse = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({ title: 'Task to Steal', priority: 'low', categoryId: testCategoryId, isPublic: false })
      .expect(201);
    
    const taskToStealId: string = taskResponse.body.id; 
    
    // Non-owner (anotherUser) mencoba mengupdate task milik testUser
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${taskToStealId}`)
      .set('Authorization', `Bearer ${anotherUserToken}`) 
      .send({ title: 'Attempted Hijack' })
      .expect(404); // Expect 404 (Not Found) sebagai fail-safe security
      
    await prisma.task.delete({ where: { id: taskToStealId } }); 
  });
  
  it('/tasks/:id (DELETE) should fail with 404 for non-existent ID', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/non-existent-id-123`)
      .set('Authorization', `Bearer ${testAccessToken}`)
      .expect(404);
  });
  
  it('/tasks/:id (DELETE) should delete a task as owner (200)', async () => {
    if (!testTaskId) throw new Error("testTaskId is null before final delete test.");
    
    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${testAccessToken}`)
      .expect(200);
      
    await request(app.getHttpServer())
        .get(`/api/v1/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(404);
  });


  // --- 5. FILE UPLOAD TESTS (Kriteria 6 & 8) ---
  describe('5. File Upload Tests', () => {
      // Asumsi endpoint: POST /api/v1/files/upload, field name: 'file'
      
      it('File upload with authentication should succeed (201)', async () => {
          await request(app.getHttpServer())
              .post('/api/v1/files/upload') 
              .set('Authorization', `Bearer ${testAccessToken}`)
              .attach('file', dummyFilePath) 
              .expect(201);
      });

      it('File upload without authentication should fail (401)', async () => {
          await request(app.getHttpServer())
              .post('/api/v1/files/upload')
              // HILANGKAN .attach('file', dummyFilePath) di sini.
              // Kita hanya perlu menguji bahwa tanpa token, endpoint ditolak (401),
              // tanpa perlu memicu Multer untuk memproses stream file.
              .expect(401);
      });
      
      // Tambahkan tes untuk 400 (tipe file salah) atau 413 (ukuran file terlalu besar) di sini jika perlu.
  });

  // --- 6. SEARCH, FILTER, AND PAGINATION TESTS (Kriteria 6 & 8) ---
  describe('6. Search, Filter, and Pagination Tests', () => {
    
    // Setup tambahan: Buat 2 task ekstra untuk testing pagination dan search
    beforeAll(async () => {
        // Task 1: Judul unik untuk Search, Priority LOW
        const searchTaskResponse = await request(app.getHttpServer())
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${testAccessToken}`)
            .send({ 
                title: 'Unique Search Term For Task A', 
                description: 'Search me!',
                priority: 'low', 
                categoryId: testCategoryId, 
                isPublic: true 
            })
            .expect(201);
        specificTaskId = searchTaskResponse.body.id;
        
        // Task 2: Priority HIGH, untuk tes filter
        await request(app.getHttpServer())
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${testAccessToken}`)
            .send({ 
                title: 'Another task for filtering', 
                priority: 'high', 
                categoryId: testCategoryId, 
                isCompleted: false 
            })
            .expect(201);
    });

    it('/tasks (GET) should support search filtering (200)', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/v1/tasks?search=Search Term For Task A') // Menguji kata kunci yang unik
            .set('Authorization', `Bearer ${testAccessToken}`)
            .expect(200);
            
        // Pastikan hanya 1 task yang kembali
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(specificTaskId);
    });

    it('/tasks (GET) should support priority filtering (200)', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/v1/tasks?priority=low') // Filter berdasarkan priority 'low'
            .set('Authorization', `Bearer ${testAccessToken}`)
            .expect(200);
            
        // Pastikan semua task yang kembali memiliki priority 'low'
        const allLowPriority = response.body.data.every(task => task.priority === 'low');
        expect(allLowPriority).toBe(true);
    });
    
    it('/tasks (GET) should support pagination (limit=1, page=2)', async () => {
        // Total Task sekarang: 1 (awal) + 1 (search) + 1 (filter) = 3 task milik testUser
        const response = await request(app.getHttpServer())
            .get('/api/v1/tasks?limit=1&page=2') // Ambil hanya 1 item di halaman kedua
            .set('Authorization', `Bearer ${testAccessToken}`)
            .expect(200);
            
        // Pastikan hanya 1 item di halaman ini, dan totalnya lebih dari 1
        expect(response.body.data.length).toBe(1); 
        expect(response.body.total).toBeGreaterThan(1);
    });
  });
});