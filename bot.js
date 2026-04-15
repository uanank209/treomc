const bedrock = require('bedrock-protocol');
const readline = require('readline');

// Bảng màu tối giản
const C = '\x1b[36m'; 
const G = '\x1b[32m'; 
const Y = '\x1b[33m'; 
const R = '\x1b[31m'; 
const W = '\x1b[0m';  

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const chatMessages = [
    "Anh em Vô Mùa cứ chơi thoải mái nhé.",
    "Server vẫn đang hoạt động ổn định.",
    "Ping mạng hiện tại khá tốt.",
    "Hệ thống giữ kết nối hoạt động bình thường.",
    "Treo server tự động 24/7..."
];

let reconnectInterval = 15000; 
let isRunning = false;
let autoChatMinutes = 4; // Mặc định 4 phút

function clearScreen() {
    console.clear();
}

function showBanner() {
    clearScreen();
    console.log(`${C}----------------------------------------${W}`);
    console.log(`${G}    VÔ MÙA KEEPER - ULTIMATE EDITION    ${W}`);
    console.log(`${C}----------------------------------------${W}\n`);
}

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    showBanner();
    console.log(`[ THIẾT LẬP HỆ THỐNG ]\n`);
    
    const ip = await ask(`${Y}➜ 1. Nhập IP Server: ${W}`);
    if (!ip) {
        console.log(`${R}[!] Không được để trống IP. Vui lòng chạy lại tool.${W}`);
        process.exit(1);
    }

    const portInput = await ask(`${Y}➜ 2. Nhập Port (Enter để mặc định 19132): ${W}`);
    const port = portInput ? parseInt(portInput) : 19132;

    const nameInput = await ask(`${Y}➜ 3. Nhập tên Bot (Enter mặc định VoMua_Bot): ${W}`);
    const botName = nameInput || 'VoMua_Bot';

    const chatDelayInput = await ask(`${Y}➜ 4. Tốc độ chat tự động (Tính bằng phút - Enter mặc định 4p): ${W}`);
    if (chatDelayInput && !isNaN(chatDelayInput)) {
        autoChatMinutes = parseInt(chatDelayInput);
    }

    rl.close();
    startBot(ip, port, botName);
}

function startBot(ip, port, botName) {
    if (isRunning) return;
    isRunning = true;

    console.log(`\n${C}[*] Tiến hành đưa ${botName} thâm nhập vào ${ip}:${port}...${W}`);

    const client = bedrock.createClient({
        host: ip,
        port: port,
        username: botName,
        offline: true
    });

    let chatTimer;
    let lookTimer;

    client.on('join', () => {
        console.log(`${G}[+] KẾT NỐI THÀNH CÔNG! Bot đã spawn trong map.${W}`);
        
        // 1. Kích hoạt hệ thống chat ngẫu nhiên
        chatTimer = setInterval(() => {
            const randomMsg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
            const time = new Date().toLocaleTimeString();
            
            client.write('text', {
                type: 'chat',
                needs_translation: false,
                source_name: client.username,
                xuid: '',
                platform_chat_id: '',
                message: randomMsg
            });
            console.log(`[${time}] ${C}Bot Tự Động ➜${W} ${randomMsg}`);
        }, autoChatMinutes * 60000); 

        // 2. Kích hoạt hệ thống "Ngó nghiêng" mô phỏng người thật
        lookTimer = setInterval(() => {
            try {
                // Xoay góc nhìn ngẫu nhiên
                const yaw = Math.random() * 360;
                const pitch = (Math.random() * 40) - 20;
                client.write('player_auth_input', {
                    pitch: pitch,
                    yaw: yaw,
                    position: { x: 0, y: 0, z: 0 },
                    move_vector: { x: 0, z: 0 },
                    head_yaw: yaw,
                    input_data: 0,
                    input_mode: 0,
                    play_mode: 0,
                    interaction_model: 0,
                    gaze_dir: { x: 0, y: 0, z: 0 },
                    tick: 0,
                    delta: { x: 0, y: 0, z: 0 },
                    transaction: null,
                    item_stack_request: null,
                    player_actions: []
                });
            } catch (e) {}
        }, 30000); // 30 giây ngó nghiêng 1 lần
    });

    // 3. Hệ thống AI Lắng nghe kênh chat
    client.on('text', (packet) => {
        // Tránh bot tự nói tự trả lời
        if (packet.source_name !== client.username && packet.message) {
            const msg = packet.message.toLowerCase();
            
            // Nếu có người gọi bot
            if (msg.includes('bot ơi') || msg.includes('bot oi')) {
                setTimeout(() => {
                    const replyMsg = `Chào ${packet.source_name}, Bot Vô Mùa vẫn đang trực server đây! Cần gì không?`;
                    client.write('text', {
                        type: 'chat',
                        needs_translation: false,
                        source_name: client.username,
                        xuid: '',
                        platform_chat_id: '',
                        message: replyMsg
                    });
                    console.log(`\x1b[35m[AI Reply]\x1b[0m Đã trả lời ${packet.source_name}`);
                }, 2000); // Đợi 2s rồi mới trả lời cho giống người gõ chữ
            }
        }
    });

    client.on('disconnect', (packet) => {
        clearInterval(chatTimer);
        clearInterval(lookTimer);
        isRunning = false;
        console.log(`\n${R}[-] Mất kết nối: ${packet.message}${W}`);
        scheduleReconnect(ip, port, botName);
    });

    client.on('error', (err) => {
        if (!err.message.includes('server closed')) {
            console.log(`${R}[!] Lỗi: ${err.message}${W}`);
        }
    });
}

function scheduleReconnect(ip, port, botName) {
    console.log(`${Y}[!] Đang kích hoạt giao thức Auto-Reconnect trong 15 giây tới...${W}`);
    setTimeout(() => {
        startBot(ip, port, botName);
    }, reconnectInterval);
}

main();
