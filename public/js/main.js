async function checkApiStatus() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    console.log("API status:", data);
  } catch (error) {
    console.error("Unable to reach API:", error);
  }
}

checkApiStatus();
