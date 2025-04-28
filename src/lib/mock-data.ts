
export interface DataItem {
  id: number;
  workOrderNumber: string;
  description: string;
  requestedBy: string;
  priority: "High" | "Medium" | "Low";
  department: string;
  dueDate: string;
  assignedTo: string;
  status: string;
}

export function generateMockData(page: number, perPage: number) {
  const total = 78;
  const statusOptions = ['Pending', 'Approved', 'Rejected'];
  const priorityOptions = ['High', 'Medium', 'Low'];
  const departmentOptions = ['Maintenance', 'Facilities', 'IT', 'Operations', 'Production', 'Quality'];
  
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  
  const data: DataItem[] = [];
  
  for (let i = start; i < end; i++) {
    const id = i + 1;
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const randomDepartment = departmentOptions[Math.floor(Math.random() * departmentOptions.length)];
    const randomPriority = priorityOptions[Math.floor(Math.random() * priorityOptions.length)];
    
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 14)); // Due dates within next 14 days
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    data.push({
      id,
      workOrderNumber: `WO-${String(id).padStart(4, '0')}`,
      description: `Maintenance Task ${id}`,
      requestedBy: `Employee ${id}`,
      priority: randomPriority,
      department: randomDepartment,
      dueDate: formattedDate,
      assignedTo: `Technician ${id % 5 + 1}`,
      status: randomStatus
    });
  }
  
  return { data, total };
}
