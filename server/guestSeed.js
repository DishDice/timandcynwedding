const timFamily = [
  'Tien Nguyen', 'Thu Tran', 'Ba Noi', 'Ong Noi', 'Christine Nguyen', 'Jonah Winton',
  'Calida Low', 'Calvin Low', 'Luan Nguyen', 'Julian Nguyen', 'Zoe', 'Chloe Low',
  'Cau Tin', 'Mo Thu', 'Katelyn Tran', 'Nathan Tran', 'Brandon Tran', 'Di Nguyet',
  'Duong Binh', 'John Tu', 'An Nguyen', 'David Tu', 'Melinda Tu', 'Christine Kim',
  'Daniel Kim', 'Di Lan', 'MS Tam', 'MS Tam Wife', 'MS Khoi', 'MS Khoi Wife',
  'MS Quang', 'MS Quang Wife', 'Thao', 'Linh', 'An', 'Bich', 'Trang', 'Son',
  'Phuong Trinh', 'Annie Phan', 'Yen', 'Anh Thu Vo', 'Matt', 'Thy Thy', 'Nguyen',
  'Ai Uyen', 'Chelsea', 'Blake Curmi', 'Simon', 'Amy', 'Olivia Winton', 'Olivia Partner',
];

const timFriends = [
  'Shania Von', 'Phoebe Tran', 'Gerry', 'Emerald Piseth An', "Emerald's Andrew",
  'Shirley Vong', 'Alan Kong', 'Sandy Ha', 'Bianca Kurniawan', 'Hannah Nguyen',
  'Tiffany Ngov', 'Henry In', 'Kevin Tran', 'David Nguyen', 'Jennifer Nguyen',
  'Anthony', "Anthony's Christine", 'Nam', "Nam's Tina", 'Eric', "Eric's Hannah",
  'Jess', 'Lachlan', 'Abby', "Abby's Partner",
];

const cynFamilyNotes = {
  'Mien Diep': 'Richmond Auntie',
  'Vivian Diep': 'Chadstone Auntie',
  'Toan Dang': 'Chadstone Uncle',
  'Jenny Diep': 'Adelaide Auntie',
  'Michael Diep': 'Uncle 9',
  'Sing Ip': 'Uncle 11',
  'Le Diep': 'Sydney Auntie',
  'Eddie Fu': 'Sydney Uncle',
  'Jesse': "Julianne's baby",
};

const cynFamily = [
  'Lea-Anne Hong', 'Howard Hong', 'Van Diep', 'Mark McCormack', 'Jenny Diep', 'Terry Yew',
  'Audrey Yew', 'Tim Howe', 'Anna Young', 'Jaiden Diep', 'Jennie Young', 'Dennis Diep',
  'Monic Lakomy-Diep', 'Olivia Diep', 'Maya Diep', 'Tung Diep', 'Allison Chang', 'Lucas Diep',
  'Nene', 'Mien Diep', 'Nancy Law', 'Jacky Law', 'Ethan Law', 'Isla Law', 'Julianne Trinh',
  'John Paul Martin', 'Jesse', 'Vivian Diep', 'Toan Dang', 'Alan Dang', 'Jennifer Lin',
  'Ben Dang', 'Lin Ng', 'Jenny Diep', 'Chong Tsang', 'Daniel Tsang', 'Michael Diep',
  'Sing Ip', 'Kerris Ip', 'Samuel Ip', 'Kingsley Ip', 'Le Diep', 'Eddie Fu', 'Stanley Fu',
  'Marissa Lim', 'Creighton Burns', 'Mama', 'Steven Hong', 'Linda Wong', 'Vincent Wong',
  'Rachel Wong', 'David Chuong', 'Ashton Chuong', 'Mischa Chuong', 'Amanda Venda',
  'Nuno Venda', 'Madeline Venda', "Madeline's Partner", 'Aaron Venda', "Aaron's Partner",
];

const cynFriendsNotes = {
  'Hugo Zlatkovic': "Ruth's baby",
};

const cynFriends = [
  'Bill Chiem', 'Liz Chiem', 'Daniel Ricardo', 'Qing Ping Li', 'Levina Wang', 'Andy Yang',
  'Isabel Yu', 'Patrick Ng', 'Patrick +1', 'Christine Wang', 'Christine +1', 'Clement Lieu',
  'Angeline Chin', 'Hugo Zlatkovic', 'Ruth Harig', 'Phil Zlatkovic', 'Renee Yu',
];

function makeGuests(names, group, notesMap = {}) {
  return names.map(name => ({
    name,
    group,
    rsvp: 'pending',
    dietary: '',
    tableNumber: '',
    notes: notesMap[name] || '',
    inviteType: '',
  }));
}

export const GUEST_SEED = [
  ...makeGuests(timFamily, 'Tim Family'),
  ...makeGuests(timFriends, 'Tim Friends'),
  ...makeGuests(cynFamily, 'Cyn Family', cynFamilyNotes),
  ...makeGuests(cynFriends, 'Cyn Friends', cynFriendsNotes),
];
