import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function uid(): string {
  return globalThis.crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19)
}

// ─── Karnataka Data ────────────────────────────────────────
const DISTRICTS = [
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Dharwad', 'Belagavi',
  'Kalaburagi', 'Davanagere', 'Mangaluru', 'Shivamogga', 'Ballari',
  'Tumakuru', 'Raichur', 'Hassan', 'Udupi', 'Chitradurga',
  'Mandya', 'Chikkamagaluru', 'Bidar', 'Gadag', 'Koppal',
  'Bagalkot', 'Haveri', 'Uttara Kannada', 'Dakshina Kannada',
  'Vijayapura', 'Yadgir', 'Kolar', 'Chamarajanagara', 'Kodagu', 'Ramanagara'
]

const DISTRICT_WEIGHTS = [24, 16, 12, 8, 8, 7, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]

const STATION_NAMES: Record<string, string[]> = {
  'Bengaluru Urban': ['MG Road PS', 'Koramangala PS', 'Whitefield PS', 'Indiranagar PS', 'Jayanagar PS', 'Rajajinagar PS', 'Basavanagudi PS', 'Hebbal PS', 'Yelahanka PS', 'Banashankari PS'],
  'Bengaluru Rural': ['Devanahalli PS', 'Hoskote PS', 'Nelamangala PS', 'Anekal PS'],
  'Mysuru': ['Lashkar Mohalla PS', 'Krishnaraja PS', 'Nazarbad PS', 'Saraswathipuram PS'],
  'Dharwad': ['Dharwad PS', 'Hubli East PS', 'Hubli West PS', 'Navanagar PS'],
  'Belagavi': ['Belagavi Town PS', 'Camp PS', 'Goaves PS', 'Shahapur PS'],
  'Kalaburagi': ['Kalaburagi PS', 'Gulbarga Rural PS', 'Afzalpur PS'],
  'Davanagere': ['Davanagere PS', 'Harihar PS', 'Channagiri PS'],
  'Mangaluru': ['Mangaluru PS', 'Kadri PS', 'Pandeshwar PS', 'Ullal PS'],
  'Shivamogga': ['Shivamogga PS', 'Bhadravati PS', 'Sagar PS'],
  'Ballari': ['Ballari PS', 'Hospet PS', 'Toranagallu PS'],
  'Tumakuru': ['Tumakuru PS', 'Tiptur PS', 'Madhugiri PS'],
  'Raichur': ['Raichur PS', 'Manvi PS', 'Sindhnur PS'],
  'Hassan': ['Hassan PS', 'Belur PS', 'Channarayapatna PS'],
  'Udupi': ['Udupi PS', 'Manipal PS', 'Karkala PS'],
  'Chitradurga': ['Chitradurga PS', 'Hiriyur PS', 'Hosanagara PS'],
  'Mandya': ['Mandya PS', 'Maddur PS', 'Srirangapatna PS'],
  'Chikkamagaluru': ['Chikkamagaluru PS', 'Mudigere PS', 'Koppa PS'],
  'Bidar': ['Bidar PS', 'Humnabad PS', 'Basavakalyan PS'],
  'Gadag': ['Gadag PS', 'Ron PS', 'Nargund PS'],
  'Koppal': ['Koppal PS', 'Gangavati PS', 'Kushtagi PS'],
  'Bagalkot': ['Bagalkot PS', 'Jamkhandi PS', 'Ilkal PS'],
  'Haveri': ['Haveri PS', 'Ranebennur PS', 'Savanur PS'],
  'Uttara Kannada': ['Karwar PS', 'Sirsi PS', 'Bhatkal PS'],
  'Dakshina Kannada': ['Mangaluru Rural PS', 'Puttur PS', 'Moodabidri PS'],
  'Vijayapura': ['Vijayapura PS', 'Basavana Bagewadi PS', 'Indi PS'],
  'Yadgir': ['Yadgir PS', 'Shorapur PS', 'Shahpur PS'],
  'Kolar': ['Kolar PS', 'Mulbagal PS', 'Bangarpet PS'],
  'Chamarajanagara': ['Chamarajanagara PS', 'Kollegal PS', 'Gundlupet PS'],
  'Kodagu': ['Madikeri PS', 'Virajpet PS', 'Somwarpet PS'],
  'Ramanagara': ['Ramanagara PS', 'Channapatna PS', 'Kanakapura PS'],
}

const FIRST_NAMES = [
  'Ravi', 'Suresh', 'Mahesh', 'Venkatesh', 'Prakash', 'Rajesh', 'Kumar', 'Naveen',
  'Arjun', 'Karthik', 'Vikram', 'Sanjay', 'Manoj', 'Deepak', 'Santosh', 'Ganesh',
  'Basavaraj', 'Mallikarjun', 'Shivakumar', 'Parveen', 'Farooq', 'Irfan', 'Syed',
  'Lakshmi', 'Priya', 'Sunita', 'Geetha', 'Bhagya', 'Asha', 'Kavitha', 'Meera',
  'Anitha', 'Rekha', 'Savitha', 'Jayanthi', 'Nagendra', 'Harish', 'Umesh', 'Prabhu',
  'Dinesh', 'Ramesh', 'Siddarama', 'Eshwar', 'Chandra', 'Nandish', 'Vinay',
  'Pooja', 'Divya', 'Shruti', 'Neha', 'Rachana', 'Meghana', 'Tejaswini', 'Akshatha',
  'Abhishek', 'Rahul', 'Amit', 'Nitin', 'Pradeep', 'Kiran', 'Ajay', 'Vijay',
  'Sunitha', 'Yashoda', 'Bharathi', 'Kamala', 'Padma', 'Vijayalakshmi', 'Saroja',
  'Prasad', 'Shankar', 'Murthy', 'Gowda', 'Reddy', 'Patil', 'Naik', 'Kumaraswamy',
  'Thimmappa', 'Muniyappa', 'Channabasava', 'Basavanna', 'Siddu', 'Kempa', 'Obanna',
  'Linganna', 'Kallayya', 'Gurappa', 'Basavraj', 'Doddanna', 'Channakeshava', 'Madesha',
  'Venkatachalapathy', 'Rangaswamy', 'Kasturirangan', 'Narasimha', 'Janardhan', 'Gopal',
  'Krishnamurthy', 'Ramachandra', 'Sheshadri', 'Balakrishna', 'Narayana', 'Madhusudhan',
  'Subrahmanya', 'Dattatreya', 'Vishwanath', 'Gajendra', 'Hemanth', 'Sachin',
  'Rohan', 'Aditya', 'Kunal', 'Rajat', 'Nikhil', 'Pavan', 'Suman', 'Arvind',
  'Shilpa', 'Anjali', 'Roopa', 'Bindu', 'Latha', 'Sujatha', 'Vasantha', 'Yellamma',
  'Neelamma', 'Munirathnamma', 'Akamma', 'Thayamma', 'Siddamma', 'Rangamma', 'Chennamma',
  'Kamalamma', 'Lakshmamma', 'Muddamma', 'Gowramma', 'Bheemappa', 'Kallappa', 'Shivappa',
  'Mallappa', 'Basappa', 'Giddappa', 'Ningappa', 'Siddappa', 'Thippa', 'Kariyappa', 'Halappa',
  'Chikka', 'Boraiah', 'Madappa', 'Kempamma', 'Chowdamma', 'Nagamma', 'Muniyamma', 'Venkamma',
  'Lakshmavva', 'Sarvamma', 'Narasamma', 'Gurudev', 'Prabhakar', 'Raghavendra', 'Niranjan',
  'Dhananjaya', 'Basavaraju', 'Shashidhar', 'Prashanth', 'Ravishankar', 'Mahadev', 'Girish',
  'Manjunath', 'Chandrashekar', 'Rajendra', 'Siddaraju', 'Mane', 'Jadhav', 'Desai', 'Kulkarni',
  'Joshi', 'Hegde', 'Shetty', 'Pai', 'Bhat', 'Sharma', 'Gupta', 'Verma', 'Singh', 'Patel',
  'Srinivas', 'Raghuram', 'Chakravarthy', 'Balasubramanian', 'Venkataraman', 'Krishnan',
  'Subramanian', 'Ramanathan', 'Ganapathy', 'Murugan', 'Selvan', 'Padmanabhan', 'Narayanan',
  'Govindan', 'Shankaran', 'Krishnamoorthy'
]

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Reddy', 'Gowda', 'Patil', 'Naik', 'Singh', 'Verma',
  'Jadhav', 'Desai', 'Kulkarni', 'Hegde', 'Shetty', 'Bhat', 'Pai', 'Joshi',
  'Rao', 'Murthy', 'Prasad', 'Babu', 'Swamy', 'Acharya', 'Deshpande', 'Mishra',
  'Gupta', 'Patel', 'Khan', 'Shaikh', 'Syed', 'Hussain', 'Pasha', 'Baig',
  'Mulla', 'Kurban', 'Sait', 'Sab', 'Tangadagi', 'Hiremath', 'Koti',
  'Maradi', 'Gudihal', 'Kamat', 'Karki', 'Dalawai', 'Pujari', 'Honnali',
  'Talwar', 'Kambali', 'Bhandari', 'Koulagi', 'Maganur', 'Kattimani',
  'Neelgar', 'Hiregoudar', 'Patgar', 'Goudar', 'Madiwalar', 'Chougale',
  'Sajjan', 'Kalagi', 'Gurikar', 'Hosamani', 'Kabaraddi', 'Ganachari',
  'Shigavan', 'Makanur', 'Badiger', 'Bennur', 'Hukkeri', 'Hiremath',
  'Mallasamudra', 'Kavalgimath', 'Salimath', 'Kolhar', 'Nesargi', 'Morphed'
]

const CRIME_TYPES = [
  { name: 'Theft', code: 'THF', desc: 'Theft of personal or public property' },
  { name: 'Robbery', code: 'RBB', desc: 'Robbery with force or threat' },
  { name: 'Murder', code: 'MRD', desc: 'Homicide and culpable homicide' },
  { name: 'Assault', code: 'ASL', desc: 'Assault and causing grievous hurt' },
  { name: 'Fraud', code: 'FRD', desc: 'Cheating, forgery and fraud' },
  { name: 'Cyber Crime', code: 'CYB', desc: 'Computer and internet related offences' },
  { name: 'Vehicle Theft', code: 'VTH', desc: 'Theft of motor vehicles' },
  { name: 'Burglary', code: 'BGL', desc: 'House breaking and burglary' },
  { name: 'Drug Offence', code: 'DRG', desc: 'Narcotic drugs and psychotropic substances' },
  { name: 'Sexual Offence', code: 'SXL', desc: 'Crimes against women and children' },
]

const CRIME_CATEGORIES = [
  { name: 'Property Crime', code: 'PC', desc: 'Crimes against property' },
  { name: 'Violent Crime', code: 'VC', desc: 'Crimes involving violence' },
  { name: 'Economic Crime', code: 'EC', desc: 'Financial and economic offences' },
  { name: 'Cyber Crime', code: 'CC', desc: 'Technology enabled crimes' },
  { name: 'Narcotics', code: 'NC', desc: 'Drug related offences' },
  { name: 'Crime Against Women', code: 'CAW', desc: 'Offences against women' },
  { name: 'Crime Against Children', code: 'CAC', desc: 'Offences against children' },
  { name: 'Traffic Offence', code: 'TO', desc: 'Traffic violations and offences' },
]

const ACTS = [
  { name: 'Indian Penal Code', code: 'IPC', desc: 'Substantive criminal law of India' },
  { name: 'Information Technology Act', code: 'ITA', desc: 'Cyber crime and electronic evidence' },
  { name: 'Narcotic Drugs and Psychotropic Substances Act', code: 'NDPS', desc: 'Drug trafficking and consumption' },
  { name: 'Protection of Children from Sexual Offences Act', code: 'POCSO', desc: 'Child sexual abuse offences' },
  { name: 'Indian Penal Code - Property Offences', code: 'IPC-PROP', desc: 'Theft, robbery, burglary provisions' },
  { name: 'Arms Act', code: 'ARMS', desc: 'Regulation of arms and ammunition' },
  { name: 'Motor Vehicles Act', code: 'MVA', desc: 'Vehicle theft and traffic offences' },
  { name: 'Karnataka Police Act', code: 'KPA', desc: 'State police regulations' },
  { name: 'Prevention of Corruption Act', code: 'PCA', desc: 'Corruption and bribery' },
  { name: 'Scheduled Castes and Scheduled Tribes Act', code: 'SCST', desc: 'Atrocities against SC/ST' },
]

const SECTIONS = [
  { code: '302', title: 'Punishment for Murder', act: 'IPC' },
  { code: '379', title: 'Punishment for Theft', act: 'IPC' },
  { code: '395', title: 'Punishment for Dacoity', act: 'IPC' },
  { code: '420', title: 'Cheating and dishonestly inducing delivery of property', act: 'IPC' },
  { code: '354', title: 'Assault or criminal force to woman with intent to outrage modesty', act: 'IPC' },
  { code: '66-C', title: 'Punishment for identity theft', act: 'ITA' },
  { code: '66-D', title: 'Punishment for cheating by personation by using computer resource', act: 'ITA' },
  { code: '20', title: 'Punishment for contravention of provisions re: cannabis', act: 'NDPS' },
  { code: '376', title: 'Punishment for sexual assault', act: 'IPC' },
  { code: '307', title: 'Attempt to murder', act: 'IPC' },
]

const EVIDENCE_TYPES = [
  { name: 'Documentary', code: 'DOC', desc: 'Documents and records' },
  { name: 'Digital', code: 'DIG', desc: 'Digital evidence and electronic records' },
  { name: 'Forensic', code: 'FSC', desc: 'Forensic analysis reports' },
  { name: 'CCTV', code: 'CCTV', desc: 'CCTV footage and surveillance' },
  { name: 'Witness Testimony', code: 'WIT', desc: 'Recorded witness statements' },
  { name: 'Physical', code: 'PHY', desc: 'Physical objects and materials' },
  { name: 'Medical', code: 'MED', desc: 'Medical examination reports' },
]

const VEHICLE_TYPES = [
  { name: 'Motorcycle', code: 'MC', desc: 'Two-wheeler motorcycles and scooters' },
  { name: 'Car', code: 'CAR', desc: 'Four-wheeler passenger vehicles' },
  { name: 'SUV', code: 'SUV', desc: 'Sport utility vehicles' },
  { name: 'Truck', code: 'TRK', desc: 'Heavy commercial vehicles' },
  { name: 'Auto Rickshaw', code: 'AR', desc: 'Three-wheeler auto rickshaws' },
  { name: 'Bus', code: 'BUS', desc: 'Passenger buses' },
  { name: 'Bicycle', code: 'BIC', desc: 'Non-motorized bicycles' },
  { name: 'Tractor', code: 'TRA', desc: 'Agricultural tractors' },
]

const RANKS = [
  { name: 'Constable', code: 'CON', hierarchy: '10', sort: 10 },
  { name: 'Head Constable', code: 'HC', hierarchy: '9', sort: 9 },
  { name: 'Assistant Sub Inspector', code: 'ASI', hierarchy: '8', sort: 8 },
  { name: 'Sub Inspector', code: 'SI', hierarchy: '7', sort: 7 },
  { name: 'Police Inspector', code: 'PI', hierarchy: '6', sort: 6 },
  { name: 'Deputy Superintendent', code: 'DSP', hierarchy: '5', sort: 5 },
  { name: 'Superintendent', code: 'SP', hierarchy: '4', sort: 4 },
  { name: 'Deputy Commissioner', code: 'DCP', hierarchy: '3', sort: 3 },
  { name: 'Inspector General', code: 'IGP', hierarchy: '2', sort: 2 },
  { name: 'Director General', code: 'DGP', hierarchy: '1', sort: 1 },
]

const DESIGNATIONS = [
  { name: 'Constable', code: 'DES-CON', sort: 10 },
  { name: 'Head Constable', code: 'DES-HC', sort: 9 },
  { name: 'Assistant Sub Inspector', code: 'DES-ASI', sort: 8 },
  { name: 'Sub Inspector of Police', code: 'DES-SI', sort: 7 },
  { name: 'Police Inspector', code: 'DES-PI', sort: 6 },
  { name: 'Circle Inspector', code: 'DES-CI', sort: 5 },
  { name: 'Deputy Superintendent of Police', code: 'DES-DSP', sort: 4 },
  { name: 'Superintendent of Police', code: 'DES-SP', sort: 3 },
  { name: 'Deputy Inspector General', code: 'DES-DIG', sort: 2 },
  { name: 'Inspector General of Police', code: 'DES-IGP', sort: 1 },
]

const USER_ROLES = [
  { name: 'Admin', code: 'ADMIN', desc: 'System administrator with full access' },
  { name: 'SP', code: 'SP', desc: 'Superintendent of Police' },
  { name: 'DSP', code: 'DSP_ROLE', desc: 'Deputy Superintendent of Police' },
  { name: 'Inspector', code: 'INS_ROLE', desc: 'Police Inspector' },
  { name: 'Sub Inspector', code: 'SI_ROLE', desc: 'Sub Inspector of Police' },
]

const KA_VEHICLES = ['KA-01', 'KA-02', 'KA-03', 'KA-04', 'KA-05', 'KA-10', 'KA-11', 'KA-12', 'KA-13', 'KA-14', 'KA-15', 'KA-16', 'KA-17', 'KA-18', 'KA-19', 'KA-20', 'KA-25', 'KA-26', 'KA-27', 'KA-28', 'KA-29', 'KA-30', 'KA-35', 'KA-36', 'KA-37', 'KA-38', 'KA-39', 'KA-40', 'KA-41', 'KA-43', 'KA-45', 'KA-46', 'KA-47', 'KA-48', 'KA-49', 'KA-50', 'KA-51', 'KA-52', 'KA-53', 'KA-54', 'KA-55', 'KA-56', 'KA-57', 'KA-58', 'KA-59', 'KA-60', 'KA-61', 'KA-62', 'KA-63', 'KA-64', 'KA-65', 'KA-66', 'KA-67', 'KA-68', 'KA-69', 'KA-70', 'KA-71', 'KA-73', 'KA-74', 'KA-75', 'KA-76', 'KA-79', 'KA-80', 'KA-81', 'KA-82', 'KA-83', 'KA-84', 'KA-85', 'KA-86', 'KA-87', 'KA-88', 'KA-89', 'KA-90', 'KA-91', 'KA-92', 'KA-93', 'KA-94', 'KA-95', 'KA-96', 'KA-97', 'KA-98', 'KA-99']

const STATUSES = ['Under Investigation', 'Closed', 'Chargesheeted', 'Acquitted', 'Convicted']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const COMPLAINT_MODES = ['In Person', 'Phone', 'Online', 'Written', 'Email']
const CRIME_WEIGHTS = [28, 16, 6, 10, 12, 8, 10, 8, 5, 7]
const REPEAT_OFFENDERS = [
  { name: 'Ramesh Kumar', gender: 'Male', age: '34', phone: '+91-9987654321', address: 'Bengaluru Urban, Karnataka' },
  { name: 'Shivappa Naik', gender: 'Male', age: '41', phone: '+91-9876543210', address: 'Mysuru, Karnataka' },
  { name: 'Lakshmi Reddy', gender: 'Female', age: '29', phone: '+91-9765432109', address: 'Dharwad, Karnataka' },
  { name: 'Mahesh Patil', gender: 'Male', age: '37', phone: '+91-9654321098', address: 'Belagavi, Karnataka' },
  { name: 'Anitha Gowda', gender: 'Female', age: '31', phone: '+91-9543210987', address: 'Mangaluru, Karnataka' },
  { name: 'Prakash Hegde', gender: 'Male', age: '44', phone: '+91-9432109876', address: 'Ballari, Karnataka' },
  { name: 'Suhasini Rao', gender: 'Female', age: '36', phone: '+91-9321098765', address: 'Tumakuru, Karnataka' },
  { name: 'Arun Shetty', gender: 'Male', age: '39', phone: '+91-9210987654', address: 'Kalaburagi, Karnataka' },
]

const PLACES = [
  'Main Road', 'Bus Stand Area', 'Market Road', 'Railway Station Road', 'Hospital Road',
  'College Circle', 'Temple Street', 'Lake Road', 'Industrial Area', 'Residential Layout',
  'Highway NH-48', 'Highway NH-44', 'Highway NH-75', 'Highway NH-67', 'Town Center',
  'Civil Lines', 'Fort Area', 'Near KSRTC Bus Stand', 'Railway Colony', 'VIP Road',
  'Commercial Complex', 'Shopping Mall', 'ATM Counter', 'Bank Premises', 'Park Area',
  'School Premises', 'Government Office Area', 'Village Outskirts', 'Forest Area', 'Farm Land',
]

const VEHICLE_MAKES = ['Honda', 'Bajaj', 'TVS', 'Hero', 'Royal Enfield', 'Yamaha', 'Suzuki', 'Hyundai', 'Maruti Suzuki', 'Tata', 'Mahindra', 'Kia', 'Toyota', 'Ashok Leyland', 'Eicher']
const VEHICLE_MODELS = ['Activa', 'Pulsar', 'Apache', 'Splendor', 'Classic 350', 'Access', 'i20', 'Swift', 'Bolero', 'Nexon', 'Innova', 'Wagon R', 'Alto', 'Duster', 'Creta']
const VEHICLE_COLORS = ['White', 'Black', 'Red', 'Blue', 'Grey', 'Silver', 'Green', 'Yellow']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function randDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

function randLat(district: string): string {
  const base: Record<string, [number, number]> = {
    'Bengaluru Urban': [12.95, 77.59], 'Bengaluru Rural': [13.10, 77.60],
    'Mysuru': [12.30, 76.65], 'Dharwad': [15.39, 75.01], 'Belagavi': [15.85, 74.50],
    'Kalaburagi': [17.33, 76.84], 'Davanagere': [14.46, 75.92], 'Mangaluru': [12.91, 74.85],
    'Shivamogga': [13.93, 75.57], 'Ballari': [15.15, 76.93], 'Tumakuru': [13.34, 77.10],
    'Raichur': [16.21, 77.34], 'Hassan': [13.01, 76.10], 'Udupi': [13.34, 74.75],
    'Chitradurga': [14.23, 76.40], 'Mandya': [12.52, 76.90], 'Chikkamagaluru': [13.32, 75.77],
    'Bidar': [17.91, 77.52], 'Gadag': [15.43, 75.63], 'Koppal': [15.35, 76.15],
    'Bagalkot': [16.19, 75.69], 'Haveri': [14.79, 75.40], 'Uttara Kannada': [14.55, 74.49],
    'Dakshina Kannada': [12.88, 75.08], 'Vijayapura': [16.83, 75.72], 'Yadgir': [16.78, 77.13],
    'Kolar': [13.14, 78.13], 'Chamarajanagara': [12.10, 76.94], 'Kodagu': [12.34, 75.81],
    'Ramanagara': [12.72, 77.28],
  }
  const [lat] = base[district] || [13.0, 77.0]
  return (lat + (Math.random() - 0.5) * 0.3).toFixed(6)
}

function randLng(district: string): string {
  const base: Record<string, [number, number]> = {
    'Bengaluru Urban': [12.95, 77.59], 'Bengaluru Rural': [13.10, 77.60],
    'Mysuru': [12.30, 76.65], 'Dharwad': [15.39, 75.01], 'Belagavi': [15.85, 74.50],
    'Kalaburagi': [17.33, 76.84], 'Davanagere': [14.46, 75.92], 'Mangaluru': [12.91, 74.85],
    'Shivamogga': [13.93, 75.57], 'Ballari': [15.15, 76.93], 'Tumakuru': [13.34, 77.10],
    'Raichur': [16.21, 77.34], 'Hassan': [13.01, 76.10], 'Udupi': [13.34, 74.75],
    'Chitradurga': [14.23, 76.40], 'Mandya': [12.52, 76.90], 'Chikkamagaluru': [13.32, 75.77],
    'Bidar': [17.91, 77.52], 'Gadag': [15.43, 75.63], 'Koppal': [15.35, 76.15],
    'Bagalkot': [16.19, 75.69], 'Haveri': [14.79, 75.40], 'Uttara Kannada': [14.55, 74.49],
    'Dakshina Kannada': [12.88, 75.08], 'Vijayapura': [16.83, 75.72], 'Yadgir': [16.78, 77.13],
    'Kolar': [13.14, 78.13], 'Chamarajanagara': [12.10, 76.94], 'Kodagu': [12.34, 75.81],
    'Ramanagara': [12.72, 77.28],
  }
  const [, lng] = base[district] || [13.0, 77.0]
  return (lng + (Math.random() - 0.5) * 0.3).toFixed(6)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function createManyInBatches<T>(
  fn: (chunk: T[]) => Promise<unknown>,
  data: T[],
  batchSize = 500,
): Promise<void> {
  for (let i = 0; i < data.length; i += batchSize) {
    await fn(data.slice(i, i + batchSize))
  }
}

async function main() {
  console.log('🌱 Seeding CrimeSight AI database with realistic KSP-style FIR data...')
  const t = now()

  // ── 1. State ──
  const stateId = uid()
  await db.state.create({
    data: {
      ROWID: stateId,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      state_name: 'Karnataka',
      state_code: 'KA',
      is_active: true,
    },
  })
  console.log('  ✅ State: Karnataka')

  // ── 2. Districts ──
  const districtIds: Record<string, string> = {}
  const districtData = DISTRICTS.map((name, i) => {
    const id = uid()
    districtIds[name] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      district_name: name,
      district_code: `KA-${String(i + 1).padStart(2, '0')}`,
      state_rowid: stateId,
      is_active: true,
    }
  })
  await db.district.createMany({ data: districtData })
  console.log(`  ✅ Districts: ${districtData.length}`)

  // ── 3. Units (Police Stations) ──
  const unitIds: string[] = []
  const unitData: any[] = []
  let unitIdx = 1
  for (const [district, stations] of Object.entries(STATION_NAMES)) {
    for (const station of stations) {
      const id = uid()
      unitIds.push(id)
      unitData.push({
        ROWID: id,
        CREATORID: 'system',
        CREATEDTIME: t,
        MODIFIEDTIME: t,
        unit_name: station,
        unit_code: `PS-${String(unitIdx).padStart(3, '0')}`,
        district_rowid: districtIds[district],
        unit_type: 'Police Station',
        address: `${station}, ${district}, Karnataka`,
        latitude: randLat(district),
        longitude: randLng(district),
        contact_number: `+91-80-${String(2000000 + unitIdx).slice(-8)}`,
        email: `${station.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@ksp.gov.in`,
        is_active: true,
      })
      unitIdx += 1
    }
  }
  await db.unit.createMany({ data: unitData })
  console.log(`  ✅ Police Stations: ${unitData.length}`)

  // ── 4. Ranks ──
  const rankIds: Record<string, string> = {}
  const rankData = RANKS.map((r) => {
    const id = uid()
    rankIds[r.name] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      rank_name: r.name,
      hierarchy: r.hierarchy,
      is_active: true,
      rank_code: r.code,
    }
  })
  await db.rank.createMany({ data: rankData })
  console.log(`  ✅ Ranks: ${rankData.length}`)

  // ── 5. Designations ──
  const designationIds: Record<string, string> = {}
  const desigData = DESIGNATIONS.map((d) => {
    const id = uid()
    designationIds[d.name] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      designation_name: d.name,
      sort_order: d.sort,
      is_active: true,
      designation_code: d.code,
    }
  })
  await db.designation.createMany({ data: desigData })
  console.log(`  ✅ Designations: ${desigData.length}`)

  // ── 6. User Roles ──
  const roleIds: Record<string, string> = {}
  const roleData = USER_ROLES.map((r) => {
    const id = uid()
    roleIds[r.name] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      role_name: r.name,
      role_code: r.code,
      description: r.desc,
      is_active: true,
    }
  })
  await db.userRole.createMany({ data: roleData })
  console.log(`  ✅ User Roles: ${roleData.length}`)

  // ── 7. Crime Types ──
  const crimeTypeIds: Record<string, string> = {}
  const ctData = CRIME_TYPES.map((ct) => {
    const id = uid()
    crimeTypeIds[ct.name] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      crime_type_name: ct.name,
      crime_type_code: ct.code,
      description: ct.desc,
      is_active: true,
    }
  })
  await db.crimeType.createMany({ data: ctData })
  console.log(`  ✅ Crime Types: ${ctData.length}`)

  // ── 8. Crime Categories ──
  const ccIds: Record<string, string> = {}
  const ccData = CRIME_CATEGORIES.map((cc) => {
    const id = uid()
    ccIds[cc.name] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      crime_category_name: cc.name,
      crime_category_code: cc.code,
      description: cc.desc,
      is_active: true,
    }
  })
  await db.crimeCategory.createMany({ data: ccData })
  console.log(`  ✅ Crime Categories: ${ccData.length}`)

  // ── 9. Acts ──
  const actIds: Record<string, string> = {}
  const actData = ACTS.map((a) => {
    const id = uid()
    actIds[a.code] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      act_name: a.name,
      act_code: a.code,
      description: a.desc,
      is_active: true,
    }
  })
  await db.act.createMany({ data: actData })
  console.log(`  ✅ Acts: ${actData.length}`)

  // ── 10. Sections ──
  const sectionIds: string[] = []
  const secData = SECTIONS.map((s) => {
    const id = uid()
    sectionIds.push(id)
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      section_code: s.code,
      section_title: s.title,
      act_rowid: actIds[s.act],
      description: s.title,
      is_active: true,
    }
  })
  await db.section.createMany({ data: secData })
  console.log(`  ✅ Sections: ${secData.length}`)

  // ── 11. Evidence Types ──
  const evTypeIds: Record<string, string> = {}
  const evData = EVIDENCE_TYPES.map((e) => {
    const id = uid()
    evTypeIds[e.name] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      evidence_type_name: e.name,
      evidence_type_code: e.code,
      description: e.desc,
      is_active: true,
    }
  })
  await db.evidenceType.createMany({ data: evData })
  console.log(`  ✅ Evidence Types: ${evData.length}`)

  // ── 12. Vehicle Types ──
  const vtIds: Record<string, string> = {}
  const vtData = VEHICLE_TYPES.map((v) => {
    const id = uid()
    vtIds[v.name] = id
    return {
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      vehicle_type_name: v.name,
      vehicle_type_code: v.code,
      description: v.desc,
      is_active: true,
    }
  })
  await db.vehicleType.createMany({ data: vtData })
  console.log(`  ✅ Vehicle Types: ${vtData.length}`)

  // ── 13. Employees ──
  const empIds: string[] = []
  const empData: any[] = []
  const usedNames = new Set<string>()
  for (let i = 0; i < 220; i++) {
    const id = uid()
    empIds.push(id)
    let name: string
    do {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    } while (usedNames.has(name))
    usedNames.add(name)

    empData.push({
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      employee_id: `KSP${String(1000 + i)}`,
      full_name: name,
      badge_number: `BG${String(5000 + i)}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@ksp.gov.in`,
      phone: `+91-${String(9000000000 + Math.floor(Math.random() * 1000000000))}`,
      rank_rowid: rankIds[pick(RANKS).name],
      designation_rowid: designationIds[pick(DESIGNATIONS).name],
      unit_rowid: pick(unitIds),
      role_rowid: roleIds[pick(USER_ROLES).name],
      profile_photo: '',
      biometric_id: `BIO-${String(10000 + i)}`,
      is_active: Math.random() > 0.05,
    })
  }
  await db.employee.createMany({ data: empData })
  console.log(`  ✅ Employees: ${empData.length}`)

  // ── 14. CaseMaster / FIRs ──
  const caseCount = 1250
  const caseIds: string[] = []
  const caseData: any[] = []
  const dateStart = new Date('2024-01-01')
  const dateEnd = new Date('2026-06-30')
  const ctNames = CRIME_TYPES.map((c) => c.name)
  const ccNames = CRIME_CATEGORIES.map((c) => c.name)

  for (let i = 0; i < caseCount; i++) {
    const id = uid()
    caseIds.push(id)
    const district = pickWeighted(DISTRICTS, DISTRICT_WEIGHTS)
    const crimeType = pickWeighted(ctNames, CRIME_WEIGHTS)
    const priority = pickWeighted(PRIORITIES, [20, 45, 25, 10])
    const status = pickWeighted(STATUSES, [35, 20, 25, 10, 10])
    const occDate = randDate(dateStart, dateEnd)
    const compDate = new Date(new Date(occDate).getTime() + Math.random() * 48 * 3600000)
      .toISOString().replace('T', ' ').substring(0, 19)

    const incidentYear = new Date(occDate).getFullYear()
    const firNo = `FIR-${incidentYear}-${String(i + 1).padStart(5, '0')}`

    caseData.push({
      ROWID: id,
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      fir_number: firNo,
      crime_type_rowid: crimeTypeIds[crimeType],
      crime_category_rowid: ccIds[pick(ccNames)],
      act_rowid: pick(Object.values(actIds)),
      section_rowid: pick(sectionIds),
      unit_rowid: pick(unitIds),
      district_rowid: districtIds[district],
      state_rowid: stateId,
      occurrence_datetime: occDate,
      complaint_datetime: compDate,
      latitude: randLat(district),
      longitude: randLng(district),
      place_of_occurrence: `${pick(PLACES)}, ${district}`,
      complaint_mode: pick(COMPLAINT_MODES),
      case_priority: priority,
      case_status: status,
      investigation_officer_rowid: pick(empIds),
      created_by_rowid: pick(empIds),
      ai_risk_score: priority === 'Critical' || status === 'Chargesheeted'
        ? Math.round((0.7 + Math.random() * 0.25) * 100) / 100
        : Math.round((0.25 + Math.random() * 0.45) * 100) / 100,
      ai_summary: status === 'Under Investigation' || priority === 'Critical'
        ? `AI Analysis: Pattern matches ${randomInt(1, 4)} similar cases. Recommended action: ${priority === 'Critical' ? 'deploy surveillance and forensic support' : 'review witness statements and follow-up leads'}.`
        : null,
      is_sensitive: priority === 'Critical' || Math.random() > 0.9,
    })
  }

  await createManyInBatches((chunk) => db.caseMaster.createMany({ data: chunk }), caseData, 500)
  console.log(`  ✅ Generated ${caseData.length} Cases`)

  // ── 15. Suspects ──
  const suspectData: any[] = []
  for (const caseId of caseIds) {
    const suspectCount = randomInt(1, 4)
    for (let i = 0; i < suspectCount; i++) {
      const repeatOffender = Math.random() < 0.18 ? pick(REPEAT_OFFENDERS) : null
      const name = repeatOffender?.name ?? `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
      suspectData.push({
        ROWID: uid(),
        CREATORID: 'system',
        CREATEDTIME: t,
        MODIFIEDTIME: t,
        case_rowid: caseId,
        suspect_name: name,
        gender: repeatOffender?.gender ?? (Math.random() > 0.15 ? 'Male' : 'Female'),
        age: repeatOffender?.age ?? String(randomInt(16, 60)),
        phone: repeatOffender?.phone ?? (Math.random() > 0.3 ? `+91-${String(9000000000 + Math.floor(Math.random() * 1000000000))}` : ''),
        email: Math.random() > 0.7 ? `${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@gmail.com` : '',
        aadhaar_number: Math.random() > 0.4 ? String(Math.floor(Math.random() * 900000000000) + 100000000000) : '',
        address: repeatOffender?.address ?? `${pick(PLACES)}, ${pick(DISTRICTS)}, Karnataka`,
        occupation: pick(['Unemployed', 'Daily Wage', 'Farmer', 'Driver', 'Shopkeeper', 'Student', 'Businessman', 'Laborer', 'Auto Driver', 'Tailor', 'Carpenter', 'Mason']),
        arrest_status: Math.random() > 0.45 ? 'Arrested' : 'At Large',
        is_repeat_offender: Boolean(repeatOffender),
        remarks: repeatOffender ? 'Known repeat offender with prior linked cases' : (Math.random() > 0.65 ? 'Under investigation' : ''),
      })
    }
  }
  await createManyInBatches((chunk) => db.suspect.createMany({ data: chunk }), suspectData, 500)
  console.log(`  ✅ Suspects: ${suspectData.length}`)

  // ── 16. Witnesses ──
  const witnessData: any[] = []
  for (const caseId of caseIds) {
    const witnessCount = randomInt(1, 3)
    for (let i = 0; i < witnessCount; i++) {
      witnessData.push({
        ROWID: uid(),
        CREATORID: 'system',
        CREATEDTIME: t,
        MODIFIEDTIME: t,
        case_rowid: caseId,
        witness_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        phone: Math.random() > 0.25 ? `+91-${String(9000000000 + Math.floor(Math.random() * 1000000000))}` : '',
        email: Math.random() > 0.8 ? 'witness@email.com' : '',
        address: `${pick(DISTRICTS)}, Karnataka`,
        statement: 'Witness statement recorded under Section 161 CrPC regarding the incident.',
        witness_type: pick(['Eyewitness', 'Informant', 'Victim Witness', 'Expert Witness']),
      })
    }
  }
  await createManyInBatches((chunk) => db.witness.createMany({ data: chunk }), witnessData, 500)
  console.log(`  ✅ Witnesses: ${witnessData.length}`)

  // ── 17. Evidence ──
  const evidenceData: any[] = []
  const evNames = ['Fingerprint Report', 'CCTV Footage', 'Mobile Phone', 'Laptop', 'Blood Sample', 'Weapon', 'Document', 'Photograph', 'DNA Report', 'Financial Record', 'Vehicle Parts', 'Clothing', 'Tool marks', 'Digital Device', 'Medical Report', 'Handwriting Sample']
  for (const caseId of caseIds) {
    const evidenceCount = randomInt(2, 5)
    for (let i = 0; i < evidenceCount; i++) {
      const evName = pick(evNames)
      evidenceData.push({
        ROWID: uid(),
        CREATORID: 'system',
        CREATEDTIME: t,
        MODIFIEDTIME: t,
        case_rowid: caseId,
        evidence_type_rowid: pick(Object.values(evTypeIds)),
        evidence_name: evName,
        description: `${evName} collected from the scene of crime.`,
        file_url: '',
        collected_by_rowid: pick(empIds),
        collection_datetime: randDate(dateStart, dateEnd),
        chain_of_custody: 'Collected by KSP officer and transferred to FSL.',
        forensic_status: pick(['Pending', 'Under Analysis', 'Completed', 'Not Required']),
      })
    }
  }
  await createManyInBatches((chunk) => db.evidence.createMany({ data: chunk }), evidenceData, 500)
  console.log(`  ✅ Evidence: ${evidenceData.length}`)

  // ── 18. Vehicles ──
  const vehicleData: any[] = []
  for (const caseId of caseIds) {
    const vehicleCount = Math.random() < 0.6 ? 0 : randomInt(1, 3)
    for (let i = 0; i < vehicleCount; i++) {
      const make = pick(VEHICLE_MAKES)
      vehicleData.push({
        ROWID: uid(),
        CREATORID: 'system',
        CREATEDTIME: t,
        MODIFIEDTIME: t,
        case_rowid: caseId,
        vehicle_number: `${pick(KA_VEHICLES)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
        vehicle_type_rowid: vtIds[pick(VEHICLE_TYPES).name],
        make,
        model: pick(VEHICLE_MODELS),
        color: pick(VEHICLE_COLORS),
        owner_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        chassis_number: `CH${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
        engine_number: `EN${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
        seized_status: Math.random() > 0.4,
      })
    }
  }
  await createManyInBatches((chunk) => db.vehicle.createMany({ data: chunk }), vehicleData, 500)
  console.log(`  ✅ Vehicles: ${vehicleData.length}`)

  // ── 19. Arrests / Surrenders ──
  const arrestData: any[] = []
  for (const caseId of caseIds) {
    const arrestCount = Math.random() < 0.7 ? 0 : randomInt(1, 2)
    for (let i = 0; i < arrestCount; i++) {
      arrestData.push({
        ROWID: uid(),
        CREATORID: 'system',
        CREATEDTIME: t,
        MODIFIEDTIME: t,
        case_rowid: caseId,
        accused_rowid: uid(),
        arrest_type: pick(['Arrest', 'Surrender', 'Arrest on Warrant']),
        arrest_datetime: randDate(dateStart, dateEnd),
        arrest_location: `${pick(DISTRICTS)}, Karnataka`,
        arresting_officer_rowid: pick(empIds),
        remarks: '',
      })
    }
  }
  await createManyInBatches((chunk) => db.arrestSurrender.createMany({ data: chunk }), arrestData, 500)
  console.log(`  ✅ Arrests / Surrenders: ${arrestData.length}`)

  // ── 20. Chargesheets ──
  const chargesheetData: any[] = []
  const courts = ['District Court Bengaluru', 'Sessions Court Mysuru', 'Magistrate Court Dharwad', 'District Court Mangaluru', 'Sessions Court Belagavi', 'Fast Track Court Bengaluru', 'District Court Shivamogga', 'Magistrate Court Davanagere', 'District Court Kalaburagi', 'Sessions Court Ballari']
  for (const caseId of caseIds) {
    if (Math.random() > 0.5) {
      chargesheetData.push({
        ROWID: uid(),
        CREATORID: 'system',
        CREATEDTIME: t,
        MODIFIEDTIME: t,
        case_rowid: caseId,
        filing_date: randDate(new Date('2024-06-01'), dateEnd),
        court_name: pick(courts),
        judge_name: `Hon'ble Justice ${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        chargesheet_number: `CS-${new Date().getFullYear()}-${String(chargesheetData.length + 1).padStart(4, '0')}`,
        filing_status: pick(['Filed', 'Under Trial', 'Disposed']),
        document_url: '',
      })
    }
  }
  await createManyInBatches((chunk) => db.chargesheet.createMany({ data: chunk }), chargesheetData, 500)
  console.log(`  ✅ Chargesheets: ${chargesheetData.length}`)

  // ── 21. Investigation Activities ──
  const invData: any[] = []
  const actTypes = ['Scene Visit', 'Witness Examination', 'Evidence Collection', 'Surveillance', 'Raid', 'Interrogation', 'Forensic Request', 'Court Appearance', 'Briefing', 'Patrol']
  for (const caseId of caseIds) {
    const activityCount = randomInt(4, 8)
    for (let i = 0; i < activityCount; i++) {
      invData.push({
        ROWID: uid(),
        CREATORID: 'system',
        CREATEDTIME: t,
        MODIFIEDTIME: t,
        case_rowid: caseId,
        activity_type: pick(actTypes),
        activity_description: 'Investigation activity conducted as part of case proceedings.',
        activity_datetime: randDate(dateStart, dateEnd),
        officer_rowid: pick(empIds),
        attachment_url: '',
      })
    }
  }
  await createManyInBatches((chunk) => db.investigationActivity.createMany({ data: chunk }), invData, 500)
  console.log(`  ✅ Investigation Activities: ${invData.length}`)

  // ── 22. Case Assignments ──
  const assignData: any[] = []
  caseIds.forEach((caseId) => {
    assignData.push({
      ROWID: uid(),
      CREATORID: 'system',
      CREATEDTIME: t,
      MODIFIEDTIME: t,
      case_rowid: caseId,
      assigned_to_rowid: pick(empIds),
      assigned_by_rowid: pick(empIds),
      assigned_datetime: randDate(dateStart, dateEnd),
      assignment_status: pick(['Active', 'Transferred', 'Completed']),
      remarks: '',
    })
  })
  await createManyInBatches((chunk) => db.caseAssignment.createMany({ data: chunk }), assignData, 500)
  console.log(`  ✅ Case Assignments: ${assignData.length}`)

  console.log('')
  console.log('✅ Database seeded successfully!')
  console.log(`   Total records generated: ${1 + districtData.length + unitData.length + rankData.length + desigData.length + roleData.length + ctData.length + ccData.length + actData.length + secData.length + evData.length + vtData.length + empData.length + caseData.length + suspectData.length + witnessData.length + evidenceData.length + vehicleData.length + arrestData.length + chargesheetData.length + invData.length + assignData.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
