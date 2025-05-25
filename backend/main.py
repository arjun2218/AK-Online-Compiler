from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess

app = Flask(__name__)
CORS(app)

@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    code = data.get("code")
    user_input = data.get("input")

    with open("temp.py", "w") as f:
        f.write(code)

    try:
        result = subprocess.run(
            ["python", "temp.py"],
            input=user_input.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=5
        )
        output = result.stdout.decode() + result.stderr.decode()
    except subprocess.TimeoutExpired:
        output = "Error: Execution timed out"

    return jsonify({"output": output})

if __name__ == '__main__':
    app.run(debug=True)
