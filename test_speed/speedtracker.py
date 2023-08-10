import time
import speedtest
import psutil
from pynput import mouse

def get_speed():
    st = speedtest.Speedtest()
    st.get_best_server()
    download_speed = st.download() / 1024 / 1024  # Convert to Mbps
    upload_speed = st.upload() / 1024 / 1024  # Convert to Mbps
    return download_speed, upload_speed

def on_click(x, y, button, pressed):
    if pressed:
        download_speed, upload_speed = get_speed()
        current_time = time.strftime("%Y-%m-%d %H:%M:%S")
        cpu_usage = psutil.cpu_percent()
        ram_usage = psutil.virtual_memory().percent
        print(f"Time: {current_time} | Download Speed: {download_speed:.2f} Mbps | Upload Speed: {upload_speed:.2f} Mbps | CPU Usage: {cpu_usage:.2f}% | RAM Usage: {ram_usage:.2f}%")

# Main program
if __name__ == "__main__":
    print("Internet Speed and Resource Monitor (Click to show info)")

    # Set up mouse listener
    with mouse.Listener(on_click=on_click) as listener:
        listener.join()
