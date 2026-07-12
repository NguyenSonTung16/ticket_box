const axios = require('axios');

// THAY ĐỔI TOKEN CỦA BẠN VÀO ĐÂY (Lấy từ Local Storage lúc Login trên web)
const user1Token = 'MOCK_TOKEN_1'; 
const user2Token = 'MOCK_TOKEN_2'; 
const concertId = '1';
const targetSeat = 'C-15'; // Đảm bảo ghế này đang trống (AVAILABLE)

async function bookSeat(userName, token, isFaster) {
  try {
    const response = await axios.post(
      'http://localhost:3333/api/booking/svip',
      {
        concert_id: concertId,
        seatNos: [targetSeat],
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log(`😎 ${userName}: Chốt ghế THÀNH CÔNG (Mã: ${response.status})`);
  } catch (error) {
    console.log(`😭 ${userName}: Thất bại, ghế đã bị giành (Mã: ${error.response?.status || 500}) - Lỗi: ${error.response?.data?.message || error.message}`);
  }
}

async function runRace() {
  console.log(`\n🚀 CHUẨN BỊ MÔ PHỎNG TRANH GIÀNH GHẾ [ ${targetSeat} ]...\n`);
  
  // Dùng Promise.all để bắn 2 request cùng lúc (đồng thời)
  await Promise.all([
    bookSeat('Người đến trước', user1Token, true),
    bookSeat('Người đến sau (Chậm 1ms)', user2Token, false)
  ]);
  
  console.log(`\n🏁 KẾT THÚC!\n`);
}

runRace();
