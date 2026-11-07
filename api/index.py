import os
import json
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            user_message = data.get('message', '')

            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "API key missing in Vercel env"}')
                return

            # Gemini API Request
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = json.dumps({
                "contents": [{"parts": [{"text": user_message}]}]
            }).encode('utf-8')

            req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
            
            try:
                with urllib.request.urlopen(req) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    ai_reply = res_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Empty response')
            except urllib.error.HTTPError as e:
                error_detail = e.read().decode('utf-8', errors='ignore')
                ai_reply = f"API HTTP Error {e.code}: {error_detail[:100]}"
            except Exception as ex:
                ai_reply = f"Request Error: {str(ex)}"

            safe_reply = ai_reply.encode('ascii', 'ignore').decode('ascii')
            response_body = json.dumps({"reply": safe_reply}).encode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_body)

        except Exception as err:
            err_str = str(err).encode('ascii', 'ignore').decode('ascii')
            error_body = json.dumps({"error": err_str}).encode('utf-8')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(error_body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
