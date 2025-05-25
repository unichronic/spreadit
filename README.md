# 🚀 Spreadit - Multi-Platform Content Publishing

**Write once, publish everywhere.** Spreadit is a full-stack application that helps content creators distribute their articles across multiple blogging platforms with platform-specific customizations.


## ✨ Features

### 📝 **Content Creation**
- **Rich Text Editor**: Intuitive editor with markdown shortcuts and formatting
- **Markdown Support**: Write in markdown with live preview
- **Draft Management**: Save and manage drafts before publishing
- **Content Versioning**: Track changes and revisions

### 🚀 **Multi-Platform Publishing**
- **Simultaneous Publishing**: Publish to multiple platforms at once
- **Platform-Specific Customization**: Tailor content for each platform's audience
- **Background Processing**: Asynchronous publishing with Celery workers
- **Publishing Status Tracking**: Monitor success/failure for each platform

### 🔗 **Supported Platforms**
- **✅ Dev.to**: API key authentication
- **✅ Hashnode**: Personal Access Token authentication  
- **✅ Medium**: OAuth authentication
- **🔄 Twitter**: Coming soon
- **🔄 LinkedIn**: Coming soon

### 🛡️ **Security & Authentication**
- **JWT Authentication**: Secure user sessions
- **OAuth Integration**: Seamless platform connections


### ⚡ **Performance & Reliability**
- **Background Tasks**: Celery with Redis for async processing
- **Database Optimization**: PostgreSQL with SQLAlchemy ORM
- **Error Handling**: Comprehensive error tracking and recovery


### **Database Schema**
- **Users**: User accounts and authentication
- **Posts**: Article content and metadata
- **PlatformCredentials**: Encrypted API keys and OAuth tokens
- **PublishedPosts**: Publishing history and status tracking

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: TipTap rich text editor
- **State Management**: React hooks and context
- **HTTP Client**: Fetch API with custom wrapper

### **Backend**
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with python-jose
- **Background Tasks**: Celery with Redis
- **API Documentation**: Automatic OpenAPI/Swagger docs
- **HTTP Client**: httpx for external API calls

### **Infrastructure**
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Task Queue**: Celery workers
- **Environment**: Docker-ready configuration

## 🚀 Quick Start

### **Prerequisites**
- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** database
- **Redis** server

### **1. Clone the Repository**
```bash
git clone <your-repo-url>
cd cross
```

### **2. Backend Setup**
```bash
cd be

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp ../env.template .env
# Edit .env with your database and API credentials

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **3. Frontend Setup**
```bash
cd fe

# Install dependencies
npm install

# Set up environment variables
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the development server
npm run dev
```

### **4. Start Background Workers (Optional)**
```bash
cd be

# Start Redis server (in separate terminal)
redis-server

# Start Celery worker (in separate terminal)
python start_worker.py
```

### **5. Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs


### **Manual Testing**
The project includes several test scripts in the `be/` directory:
- `test_auth.py` - Authentication flow
- `test_complete_pipeline.py` - End-to-end publishing
- `test_hashnode_connection.py` - Hashnode integration

## 🔍 Development

### **Database Migrations**
```bash
cd be

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```


