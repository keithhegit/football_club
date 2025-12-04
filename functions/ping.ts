export async function onRequest(context) {
    console.error("Ping request received (ERROR LEVEL)");
    return new Response("Pong!");
}
