import * as fs from 'fs';
import * as path from 'path';

// Define the output file path
const args = process.argv.slice(2);
let numRows = 100; // default to 100 rows
if (args.length > 0 && !isNaN(parseInt(args[0]))) {
    numRows = parseInt(args[0]);
}

const outputFile = path.join(process.cwd(), 'generated_vip_guests.csv');

// Sample data for generating random names and emails
const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly'];
const lastNames = ['An', 'Binh', 'Cuong', 'Dung', 'Em', 'Phong', 'Giang', 'Hai', 'Linh', 'Khoa', 'Lan', 'Minh', 'Nga', 'Oanh', 'Phuc', 'Quang', 'Trang', 'Son', 'Tuan', 'Uy', 'Vy', 'Xuan', 'Yen'];
const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com', 'company.vn'];
const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'VIP', 'VVIP', 'SVIP'];

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(): string {
    const fn = getRandomElement(firstNames);
    const mn = getRandomElement(lastNames);
    const ln = getRandomElement(lastNames);
    // 50% chance to have a middle name
    if (Math.random() > 0.5) {
        return `${fn} ${mn} ${ln}`;
    }
    return `${fn} ${ln}`;
}

function generateEmail(name: string): string {
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = getRandomInt(1, 999);
    const domain = getRandomElement(domains);
    return `${normalizedName}${randomSuffix}@${domain}`;
}

// Ensure unique seatNo
const generatedSeats = new Set<string>();

function generateSeatNo(): string {
    let seatNo = '';
    while (true) {
        const row = getRandomElement(rows);
        const num = getRandomInt(1, 500); // 1 to 500 seats per row
        seatNo = `${row}-${num}`;
        if (!generatedSeats.has(seatNo)) {
            generatedSeats.add(seatNo);
            break;
        }
    }
    return seatNo;
}

console.log(`Generating CSV with ${numRows} valid VIP guest records...`);

// The required header for MinIO import validation
const lines = ['seatNo,name,email'];

for (let i = 0; i < numRows; i++) {
    const seatNo = generateSeatNo();
    const name = generateName();
    const email = generateEmail(name);
    
    // Validate the generated row just in case
    // 1. seatNo must be split by '-' into 2 parts
    // 2. name and email must not be empty
    if (seatNo.split('-').length !== 2 || !name || !email) {
        console.error(`Generated invalid data at row ${i+1}: seatNo=${seatNo}, name=${name}, email=${email}`);
        process.exit(1);
    }

    lines.push(`${seatNo},${name},${email}`);
}

fs.writeFileSync(outputFile, lines.join('\n') + '\n', 'utf8');

console.log(`Successfully generated ${numRows} rows in ${outputFile}`);
console.log('Sample row data:');
console.log(lines[1]);
