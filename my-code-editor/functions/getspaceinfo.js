import axios from "axios";

export async function getSpaceInfo(id) {
    try {
        const token = localStorage.getItem("token"); // Get token from localStorage

        const response = await axios.post(
            "http://localhost:5000/space/getSpaceInfo",
            { id }, // Send id in the request body
            {
                headers: {
                    Authorization: `Bearer ${token}`, // Include token in headers
                    "Content-Type": "application/json",
                },
            }
        );
        console.log('getting codespace data');
        console.log(response.data);
        return response.data; // Return the API response data
    } catch (error) {
        console.error("Error fetching space info:", error);
        return null; // Return null in case of an error
    }
}
