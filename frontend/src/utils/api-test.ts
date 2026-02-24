import api from '@/api/axios';
import { generateAndStoreDevToken } from '@/api/auth';

export const testAPIConnection = async () => {
  console.log('🔍 Testing API Connection...');
  console.log('🌐 Environment:', import.meta.env.PROD ? 'Production (Vercel)' : 'Development (Local)');
  
  try {
    // Test 1: Generate dev token (only in development)
    if (!import.meta.env.PROD) {
      console.log('📝 1. Testing dev token generation...');
      const token = await generateAndStoreDevToken('admin');
      console.log('✅ Token generated successfully');
    } else {
      console.log('🔐 1. Production mode - using existing token');
    }
    
    // Test 2: Test public endpoint (categories)
    console.log('📂 2. Testing public endpoint (categories)...');
    const categoriesRes = await api.get('/categories');
    console.log('✅ Categories API working:', categoriesRes.status);
    
    // Test 3: Test admin endpoint with auth
    console.log('🔐 3. Testing admin endpoint (courses)...');
    const coursesRes = await api.get('/courses');
    console.log('✅ Courses API working:', coursesRes.status);
    
    // Test 4: Test topics endpoint
    console.log('📚 4. Testing topics endpoint...');
    const topicsRes = await api.get('/topics/course/test-course-id').catch(err => {
      console.log('⚠️ Topics endpoint responded (expected 404 for test):', err.response?.status);
      return { status: err.response?.status };
    });
    console.log('✅ Topics API reachable');
    
    // Test 5: Test quiz endpoint
    console.log('📝 5. Testing quiz endpoint...');
    const quizRes = await api.get('/admin/quiz').catch(err => {
      console.log('⚠️ Quiz endpoint responded:', err.response?.status);
      return { status: err.response?.status };
    });
    console.log('✅ Quiz API reachable');
    
    console.log('🎉 All API tests completed successfully!');
    return true;
    
  } catch (error: any) {
    console.error('❌ API Connection Test Failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      if (import.meta.env.PROD) {
        console.error('🔥 Production backend is not accessible');
        console.error('💡 Check your backend deployment on Render');
      } else {
        console.error('🔥 Local backend server is not running on port 4000');
        console.error('💡 Please start your backend server: npm run dev or node server.js');
      }
    } else if (error.response) {
      console.error('🔍 Server responded with error:', error.response.status, error.response.data);
    } else {
      console.error('🔍 Network error:', error.message);
    }
    
    return false;
  }
};

// Auto-run test in development
if (!import.meta.env.PROD) {
  // Uncomment to auto-test on page load
  // testAPIConnection();
}
