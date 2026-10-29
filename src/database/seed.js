import { addDays } from '../utils/dates.js';
// [name, city, state, industry, products, contact, designation, lat, lng] - approximate city-level demo coordinates
const D = [
['Shree Ganesh Engineering Works','Indore','Madhya Pradesh','Engineering','Industrial machinery,Gear boxes','Rakesh Verma','Owner',22.7196,75.8577],
['Malwa Auto Components','Pithampur','Madhya Pradesh','Automobile','Brake parts,Clutch plates','Sunita Joshi','Purchase Manager',22.6139,75.6933],
['Narmada Electrical Systems','Bhopal','Madhya Pradesh','Electrical and Electronics','Transformers,Panels','Anil Dubey','Director',23.2599,77.4126],
['Western Precision Tools','Pune','Maharashtra','Engineering','Precision tools,Gauges','Meera Kulkarni','Plant Head',18.5204,73.8567],
['Sunrise Packaging Industries','Mumbai','Maharashtra','Packaging','Corrugated boxes,Pouches','Imran Shaikh','GM Sales',19.076,72.8777],
['Bharat Textile Solutions','Surat','Gujarat','Textiles and Garments','Synthetic fabric,Dyed yarn','Hitesh Patel','Partner',21.1702,72.8311],
['Kutch Industrial Fabricators','Gandhidham','Gujarat','Metal Fabrication','Steel structures,Tanks','Jayesh Mehta','Owner',23.0753,70.1337],
['Rajdhani Machine Works','Delhi','Delhi','Manufacturing','Lathe machines,Presses','Vikram Malhotra','Director',28.6139,77.209],
['Haryana Auto Parts','Gurugram','Haryana','Automobile','Axles,Suspension parts','Neha Yadav','Procurement Lead',28.4595,77.0266],
['Jaipur Marble Processing','Jaipur','Rajasthan','Construction Materials','Marble slabs,Tiles','Mahesh Sharma','Owner',26.9124,75.7873],
['Coimbatore Pump Systems','Coimbatore','Tamil Nadu','Engineering','Pumps,Motors','Karthik Subramanian','MD',11.0168,76.9558],
['Chennai Precision Components','Chennai','Tamil Nadu','Engineering','CNC components,Bushings','Lakshmi Narayanan','Works Manager',13.0827,80.2707],
['Bengaluru Automation Systems','Bengaluru','Karnataka','Electrical and Electronics','PLC panels,Sensors','Arjun Rao','CTO',12.9716,77.5946],
['Hyderabad Polymer Industries','Hyderabad','Telangana','Plastic and Rubber','Moulded containers,Pipes','Farhan Qureshi','Director',17.385,78.4867],
['Kolkata Industrial Supplies','Kolkata','West Bengal','Manufacturing','Valves,Fasteners','Sourav Banerjee','Partner',22.5726,88.3639],
['Kochi Marine Fabrication','Kochi','Kerala','Metal Fabrication','Boat hulls,Deck fittings','Thomas Mathew','Owner',9.9312,76.2673],
['Lucknow Agro Equipment','Lucknow','Uttar Pradesh','Manufacturing','Threshers,Sprayers','Pankaj Tiwari','Proprietor',26.8467,80.9462],
['Ludhiana Metal Products','Ludhiana','Punjab','Metal Fabrication','Forged parts,Cycle components','Gurpreet Singh','Director',30.901,75.8573],
['Bhubaneswar Industrial Chemicals','Bhubaneswar','Odisha','Chemicals','Industrial solvents,Resins','Sasmita Das','Plant Chemist',20.2961,85.8245],
['Nagpur Packaging and Processing','Nagpur','Maharashtra','Packaging','Food packing machines,Sealers','Rohit Deshmukh','Owner',21.1458,79.0882]
];
const NOTES = ['Discussed machine upgrade and delivery timelines.','Reviewed sample parts; asked for revised quotation.','Plant tour done. Interested in annual supply contract.','Met purchase team; pricing discussion pending.','Introductory meeting. Shared company profile.'];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
export const buildDemo = () => {
  const companies = [], visits = [];
  D.forEach((d, i) => {
    const id = `demo-c${i + 1}`;
    const n = 1 + (i % 3);
    const first = -(20 + i * 8 + (n - 1) * 25);
    const noGeo = i === 5 || i === 11;
    companies.push({
      id, companyName: d[0], ownerName: d[5], ownerContact: `+91 98765 ${String(10000 + i * 37).slice(-5)}`,
      ownerContact2: '', city: d[1], siteAddress: `Plot ${12 + i}, Industrial Area Phase ${1 + (i % 3)}`,
      contactPersonName: d[6] === 'Owner' ? '' : 'Mr. Sharma', contactPersonNumber: d[6] === 'Owner' ? '' : `+91 98234 ${String(20000 + i * 29).slice(-5)}`,
      factoryName: '', industry: d[3], contactPerson: d[5], designation: d[6],
      phone: `+91 98765 ${String(10000 + i * 37).slice(-5)}`, email: `contact@${slug(d[0]).slice(0, 14)}.example.com`, website: '',
      products: d[4].split(','), description: `Demo record: ${d[4].replace(',', ' and ').toLowerCase()} manufacturer.`,
      addressLine1: `Plot ${12 + i}, Industrial Area Phase ${1 + (i % 3)}`, addressLine2: '', state: d[2],
      pinCode: String(400000 + i * 1111).slice(0, 6), country: 'India',
      googleMapsUrl: i % 4 === 0 ? `https://www.google.com/maps/search/?api=1&query=${d[7]},${d[8]}` : '',
      latitude: noGeo ? '' : +(d[7] + i * 0.002).toFixed(5), longitude: noGeo ? '' : +(d[8] + i * 0.002).toFixed(5),
      createdAt: addDays(first) + 'T09:00:00.000Z', updatedAt: addDays(first) + 'T09:00:00.000Z'
    });
    for (let k = 0; k < n; k++) {
      const vd = addDays(first + k * 25);
      visits.push({
        id: `demo-v${i + 1}-${k + 1}`, companyId: id, visitDate: vd,
        visitType: k === 0 ? 'First Visit' : k % 2 ? 'Repeat Visit' : 'Business Meeting',
        whichProductUsing: i % 2 === 0 ? 'Standard Enamel Paint' : 'Epoxy Primer',
        suggestedProduct: i % 2 === 0 ? 'Hyrox 130A, SMS 910' : 'Hyrox 110B, Red Lacquer',
        samplesGiven: [k % 2 === 0 ? 'Hyrox 130A' : 'Red Lacquer'],
        samplesGivenOther: '',
        testingDoneAtSite: i % 3 === 0 ? 'Viscosity and adhesion test done on raw metal.' : '',
        note: NOTES[(i + k) % NOTES.length],
        purpose: k === 0 ? 'Introduction and capability assessment' : 'Commercial discussion',
        productsDiscussed: d[4].split(',').slice(0, 1), businessOpportunities: i % 2 ? 'Regular monthly supply requirement' : 'Possible new line installation',
        meetingNotes: NOTES[(i + k) % NOTES.length], createdAt: vd + 'T10:00:00.000Z', updatedAt: vd + 'T10:00:00.000Z'
      });
    }
  });
  return { companies, visits };
};
