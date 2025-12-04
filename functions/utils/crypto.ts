export async function hashPassword(password: string, salt: string, iterations: number = 100000): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'HMAC', hash: 'SHA-256', length: 256 },
        true,
        ['sign', 'verify']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', key);
    return arrayBufferToHex(exportedKey);
}

export function generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return arrayBufferToHex(array.buffer);
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Simple JWT implementation using HMAC SHA-256
export async function signJWT(payload: any, secret: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await signData(data, secret);

    return `${data}.${signature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await signData(data, secret);

    if (signature !== expectedSignature) throw new Error('Invalid signature');

    return JSON.parse(atob(encodedPayload));
}

async function signData(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(data)
    );

    return arrayBufferToHex(signature);
}
