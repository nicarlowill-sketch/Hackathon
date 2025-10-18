import requests
import sys
import json
from datetime import datetime

class OneIslandPulseAPITester:
    def __init__(self, base_url="https://mapjamaica.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.user_email = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": test_password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.user_email = response['user']['email']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_email:
            self.log_test("User Login", False, "No user email available for login test")
            return False
            
        # Try to login with the registered user
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data={"email": self.user_email, "password": "TestPass123!"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_user_profile(self):
        """Test getting current user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_marker(self):
        """Test creating a marker"""
        marker_data = {
            "title": "Test Event Marker",
            "category": "event",
            "description": "This is a test event marker for API testing",
            "latitude": 18.1096,
            "longitude": -77.2975
        }
        
        success, response = self.run_test(
            "Create Marker",
            "POST",
            "markers",
            200,
            data=marker_data
        )
        
        if success and 'id' in response:
            self.test_marker_id = response['id']
            return True
        return False

    def test_get_all_markers(self):
        """Test getting all markers"""
        success, response = self.run_test(
            "Get All Markers",
            "GET",
            "markers",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} markers")
            return True
        return False

    def test_get_markers_by_category(self):
        """Test getting markers filtered by category"""
        categories = ['event', 'obstacle', 'object', 'alert']
        
        for category in categories:
            success, response = self.run_test(
                f"Get {category.title()} Markers",
                "GET",
                f"markers?category={category}",
                200
            )
            
            if success and isinstance(response, list):
                print(f"   Found {len(response)} {category} markers")
            else:
                return False
        return True

    def test_update_marker(self):
        """Test updating a marker"""
        if not hasattr(self, 'test_marker_id'):
            self.log_test("Update Marker", False, "No marker ID available for update test")
            return False
            
        update_data = {
            "title": "Updated Test Event Marker",
            "description": "This marker has been updated via API test"
        }
        
        success, response = self.run_test(
            "Update Marker",
            "PUT",
            f"markers/{self.test_marker_id}",
            200,
            data=update_data
        )
        return success

    def test_delete_marker(self):
        """Test deleting a marker"""
        if not hasattr(self, 'test_marker_id'):
            self.log_test("Delete Marker", False, "No marker ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Marker",
            "DELETE",
            f"markers/{self.test_marker_id}",
            200
        )
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Unauthorized Marker Creation",
            "POST",
            "markers",
            401,  # Expecting 401 Unauthorized
            data={
                "title": "Unauthorized Test",
                "category": "event", 
                "description": "This should fail",
                "latitude": 18.0,
                "longitude": -77.0
            }
        )
        
        # Restore token
        self.token = original_token
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🇯🇲 Starting One Island Pulse API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Authentication tests
        if not self.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ Login failed, stopping tests") 
            return False
            
        self.test_get_user_profile()
        
        # Marker CRUD tests
        if not self.test_create_marker():
            print("❌ Marker creation failed, skipping dependent tests")
        else:
            self.test_update_marker()
            self.test_delete_marker()
        
        # Marker retrieval tests
        self.test_get_all_markers()
        self.test_get_markers_by_category()
        
        # Security tests
        self.test_unauthorized_access()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = OneIslandPulseAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())