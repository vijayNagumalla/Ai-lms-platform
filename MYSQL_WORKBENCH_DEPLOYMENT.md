# 🗄️ MySQL Workbench Deployment Guide

This guide shows you how to use your existing MySQL Workbench setup for the free deployment.

## 🎯 Why Use MySQL Workbench?

- ✅ **No additional signup required**
- ✅ **Use your existing MySQL setup**
- ✅ **Full control over database**
- ✅ **Perfect for development and testing**
- ✅ **No external dependencies**

## 🛠️ Setup Steps

### Step 1: Prepare Your MySQL Database

1. **Open MySQL Workbench**
2. **Connect to your MySQL server**
3. **Create the database:**
   ```sql
   CREATE DATABASE lms_platform;
   USE lms_platform;
   ```

4. **Import the schema:**
   - Use the SQL files from `backend/database/`
   - Or run the schema creation scripts
   - Make sure all tables are created successfully

### Step 2: Make MySQL Accessible

#### Option A: Local MySQL with Port Forwarding

1. **Install ngrok (for local development):**
   ```bash
   # Download from https://ngrok.com
   # Or install via package manager
   npm install -g ngrok
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok tcp 3306
   ```

3. **Note the public URL:**
   - Example: `tcp://0.tcp.ngrok.io:12345`
   - Use this as your DB_HOST

#### Option B: Server MySQL (Recommended)

1. **Configure MySQL to accept external connections:**
   ```sql
   -- In MySQL Workbench, run:
   SELECT user, host FROM mysql.user;
   
   -- Create a user for external access:
   CREATE USER 'lms_user'@'%' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON lms_platform.* TO 'lms_user'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Update MySQL configuration:**
   ```ini
   # In my.cnf or my.ini
   [mysqld]
   bind-address = 0.0.0.0
   port = 3306
   ```

3. **Restart MySQL service:**
   ```bash
   # Windows
   net stop mysql
   net start mysql
   
   # Linux/Mac
   sudo systemctl restart mysql
   ```

4. **Configure firewall:**
   - Allow port 3306 through firewall
   - Or use a different port for security

### Step 3: Test Database Connection

1. **Test from MySQL Workbench:**
   - Create a new connection
   - Use your server's IP address
   - Test the connection

2. **Test from your application:**
   ```javascript
   // Test connection
   const mysql = require('mysql2/promise');
   
   const connection = await mysql.createConnection({
     host: 'your_server_ip',
     user: 'lms_user',
     password: 'secure_password',
     database: 'lms_platform',
     port: 3306
   });
   
   console.log('Connected to MySQL!');
   ```

### Step 4: Deploy to Vercel

1. **Set up Vercel project:**
   - Connect your GitHub repository
   - Configure build settings

2. **Add environment variables:**
   ```env
   # Database Configuration
   DB_HOST=your_server_ip
   DB_USER=lms_user
   DB_PASSWORD=secure_password
   DB_NAME=lms_platform
   DB_PORT=3306
   
   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   NODE_ENV=production
   PORT=3000
   
   # Frontend URL
   FRONTEND_URL=https://your-app.vercel.app
   
   # Judge0 Configuration
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_RAPIDAPI_KEY=your_rapidapi_key
   
   # Super Admin
   SUPER_ADMIN_REGISTRATION_CODE=SUPER_ADMIN_2024
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait for build completion
   - Test the application

## 🔧 Configuration Examples

### For Local Development with ngrok

```env
# When using ngrok for local MySQL
DB_HOST=0.tcp.ngrok.io
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lms_platform
DB_PORT=12345  # ngrok port
```

### For Server MySQL

```env
# When using server MySQL
DB_HOST=your_server_ip
DB_USER=lms_user
DB_PASSWORD=secure_password
DB_NAME=lms_platform
DB_PORT=3306
```

### For Cloud MySQL (AWS RDS, Google Cloud SQL, etc.)

```env
# When using cloud MySQL
DB_HOST=your-cloud-mysql-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=secure_password
DB_NAME=lms_platform
DB_PORT=3306
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused:**
   - Check if MySQL is running
   - Verify port is open
   - Check firewall settings

2. **Access Denied:**
   - Verify username and password
   - Check user privileges
   - Ensure user can connect from external IP

3. **Timeout Errors:**
   - Check network connectivity
   - Verify server IP address
   - Check if port is accessible

### Solutions

1. **Test Connection:**
   ```bash
   # Test from command line
   mysql -h your_server_ip -u lms_user -p lms_platform
   ```

2. **Check MySQL Status:**
   ```sql
   -- In MySQL Workbench
   SHOW PROCESSLIST;
   SHOW VARIABLES LIKE 'bind_address';
   ```

3. **Verify User Permissions:**
   ```sql
   -- Check user privileges
   SHOW GRANTS FOR 'lms_user'@'%';
   ```

## 📊 Performance Considerations

### For High Concurrency

1. **Connection Pooling:**
   - Use connection pooling in your application
   - Set appropriate pool size
   - Monitor connection usage

2. **Database Optimization:**
   - Add proper indexes
   - Optimize queries
   - Monitor performance

3. **Network Optimization:**
   - Use a fast internet connection
   - Consider using a VPS for better performance
   - Monitor latency

## 🔒 Security Best Practices

1. **User Security:**
   - Create dedicated database user
   - Use strong passwords
   - Limit user privileges

2. **Network Security:**
   - Use SSL connections
   - Consider VPN for access
   - Monitor access logs

3. **Database Security:**
   - Regular backups
   - Monitor for suspicious activity
   - Keep MySQL updated

## 📈 Monitoring

### Database Monitoring

1. **MySQL Workbench:**
   - Monitor query performance
   - Check connection status
   - View error logs

2. **Application Monitoring:**
   - Monitor database response times
   - Track connection errors
   - Set up alerts

### Performance Metrics

- Connection count
- Query execution time
- Database size
- Error rates

## 🎯 Expected Performance

With proper setup, your MySQL Workbench deployment can handle:
- ✅ **2000+ concurrent users**
- ✅ **Sub-second response times**
- ✅ **Reliable database access**
- ✅ **Full control over data**

## 📞 Support

For issues with MySQL Workbench deployment:
1. Check MySQL error logs
2. Verify network connectivity
3. Test database connection
4. Check user permissions
5. Review firewall settings

---

**Note**: This setup gives you full control over your database while maintaining the benefits of free Vercel deployment for your application.
