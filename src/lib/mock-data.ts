
export interface DataItem {
  id: number;
  workOrderNumber: string;
  workOrderType: string;
  customerAccount: string;
  description: string;
  lines: number;
  serviceLevel: string;
  criticality: string;
  startDateTime: string;
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
  const priorityOptions: Array<"High" | "Medium" | "Low"> = ['High', 'Medium', 'Low'];
  const departmentOptions = ['Maintenance', 'Facilities', 'IT', 'Operations', 'Production', 'Quality'];
  const workOrderTypes = ['Repair', 'Installation', 'Inspection', 'Maintenance', 'Emergency'];
  const serviceLevels = ['Standard', 'Premium', 'Basic', 'Extended', 'Urgent'];
  const criticalityLevels = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
  
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  
  const data: DataItem[] = [];
  
  for (let i = start; i < end; i++) {
    const id = i + 1;
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const randomDepartment = departmentOptions[Math.floor(Math.random() * departmentOptions.length)];
    const randomPriority = priorityOptions[Math.floor(Math.random() * priorityOptions.length)];
    const randomWorkOrderType = workOrderTypes[Math.floor(Math.random() * workOrderTypes.length)];
    const randomServiceLevel = serviceLevels[Math.floor(Math.random() * serviceLevels.length)];
    const randomCriticality = criticalityLevels[Math.floor(Math.random() * criticalityLevels.length)];
    const randomLines = Math.floor(Math.random() * 10) + 1;
    
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 14)); // Due dates within next 14 days
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Generate a random time
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const startDateTime = `${formattedDate} ${formattedTime}`;
    
    data.push({
      id,
      workOrderNumber: `WO-${String(id).padStart(4, '0')}`,
      workOrderType: randomWorkOrderType,
      customerAccount: `CUST-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      description: `${randomWorkOrderType} Task ${id}`,
      lines: randomLines,
      serviceLevel: randomServiceLevel,
      criticality: randomCriticality,
      startDateTime: startDateTime,
      requestedBy: `Employee ${id % 10 + 1}`,
      priority: randomPriority,
      department: randomDepartment,
      dueDate: formattedDate,
      assignedTo: `Technician ${id % 5 + 1}`,
      status: randomStatus
    });
  }
  
  return { data, total };
}
