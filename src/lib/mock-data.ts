
export interface DataItem {
  id: number;
  name: string;
  email: string;
  department: string;
  date: string;
  status: string;
}

// Generate a list of mock data
export function generateMockData(page: number, perPage: number) {
  const total = 78; // Total number of items
  const statusOptions = ['Pending', 'Approved', 'Rejected'];
  const departmentOptions = ['Marketing', 'Finance', 'HR', 'Engineering', 'Operations', 'Customer Support'];
  
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  
  const data: DataItem[] = [];
  
  for (let i = start; i < end; i++) {
    const id = i + 1;
    const randomStatus = statusOptions[Math.floor(Math.random() * (statusOptions.length - 0.01))];
    const randomDepartment = departmentOptions[Math.floor(Math.random() * (departmentOptions.length - 0.01))];
    
    // Generate a random date within the past 30 days
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - randomDaysAgo);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Create mock data item
    data.push({
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      department: randomDepartment,
      date: formattedDate,
      status: randomStatus
    });
  }
  
  return { data, total };
}
