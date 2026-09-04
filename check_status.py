import urllib.request
import time

URL = "http://100.103.32.88:3000"

def check_url(name, url):
    print(f"Checking {name}: {url}...", end=" ", flush=True)
    try:
        start = time.time()
        with urllib.request.urlopen(url, timeout=5) as response:
            status = response.getcode()
            elapsed = time.time() - start
            if status == 200:
                print(f"\033[1;32mUP\033[0m ({elapsed:.2f}s)")
            else:
                print(f"\033[1;33mWARN\033[0m (Status: {status})")
    except Exception as e:
        print(f"\033[1;31mDOWN\033[0m (Error: {e})")

if __name__ == "__main__":
    print("\033[1;34m[ Dzikr & Dua Status ]\033[0m")
    check_url("Production Web", URL)
