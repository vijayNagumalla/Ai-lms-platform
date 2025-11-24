
# ngrok Setup for Local MySQL (Optional)

## If you want to use local MySQL with Vercel:

1. Install ngrok:
   - Download from https://ngrok.com
   - Or install via package manager: npm install -g ngrok

2. Start ngrok tunnel:
   ngrok tcp 3306

3. Note the public URL (e.g., tcp://0.tcp.ngrok.io:12345)

4. Update your .env file:
   DB_HOST=0.tcp.ngrok.io
   DB_PORT=12345

5. Keep ngrok running while testing

## Alternative: Use a VPS or cloud MySQL
- Set up MySQL on a VPS
- Configure firewall to allow port 3306
- Use VPS IP as DB_HOST
