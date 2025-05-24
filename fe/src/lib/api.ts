const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // Your FastAPI backend URL

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}
interface ApiError {
  detail: string | ApiErrorDetail[];
}

export async function registerUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
  }
  return response.json();
}

export async function loginUser(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', email); // FastAPI OAuth2PasswordRequestForm expects 'username'
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
  }
  return response.json(); // Expected: { access_token: string, token_type: "bearer" }
}

// Example of a protected API call
export async function fetchUserProfile(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
  }
  return response.json();
}