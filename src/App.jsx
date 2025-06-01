import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, UploadCloud, FileText, Filter, Search, ChevronDown, ChevronUp, User, Lock, LogIn, AlertTriangle, ShieldCheck, ShieldAlert, ShieldQuestion, Edit3, Download, XCircle, FileUp, PieChart as PieChartIcon, Info, PlusCircle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';

// Mock Data (initial projects)
const initialMockProjectsData = [
  { id: 1, title: 'Lidl Blantyre', uploadDate: '2024-05-15', risksDetected: 5, documents: ['ERs_Blantyre.pdf', 'Contract_Blantyre.docx', 'Schedule_RevA.xlsx'] },
  { id: 2, title: 'Glasgow Office Refurb', uploadDate: '2024-05-20', risksDetected: 8, documents: ['Scope_Glasgow.pdf', 'Schedule_Glasgow.xlsx', 'Preliminaries_Main.pdf'] },
  { id: 3, title: 'Aberdeen Retail Park', uploadDate: '2024-05-28', risksDetected: 3, documents: ['Prelims_Aberdeen.pdf', 'Contract_Summary.docx'] },
];

const mockRisksData = [ 
  { id: 1, projectId: 1, title: "Ambiguous Access Zone for Deliveries", type: "Access", severity: "High", sourceDoc: "ERs_Blantyre.pdf", sourceRef: "Page 7, Section 3.2", notes: "Clarification needed with client regarding exact boundaries and times." },
  { id: 2, projectId: 1, title: "No Asbestos Survey Provided for Existing Structure", type: "Statutory", severity: "High", sourceDoc: "Contract_Blantyre.docx", sourceRef: "Appendix B - Missing Docs", notes: "Urgent: Request survey or conduct one before demolition." },
  { id: 3, projectId: 2, title: "Design Responsibility for Cladding Interface Unclear", type: "Design", severity: "High", sourceDoc: "Scope_Glasgow.pdf", sourceRef: "Sec 1.3, Interface Matrix", notes: "Workshop required with architect and facade contractor." },
  { id: 4, projectId: 2, title: "No Liquidated Damages Clause for Delays", type: "Contractual", severity: "High", sourceDoc: "Schedule_Glasgow.xlsx", sourceRef: "Contract Terms Tab - N/A", notes: "Legal review: Assess implication, propose addendum." },
  { id: 5, projectId: 3, title: "Unclear Payment Terms for Variations", type: "Commercial", severity: "Medium", sourceDoc: "Prelims_Aberdeen.pdf", sourceRef: "Page 3, Clause 5.4", notes: "Agree on variation approval process and rates." },
  { id: 6, projectId: 1, title: "Incomplete Ground Investigation Report", type: "Ground", severity: "Medium", sourceDoc: "ERs_Blantyre.pdf", sourceRef: "Appendix C - Geotech", notes: "Request full report or commission further tests for foundation design." },
  { id: 7, projectId: 2, title: "Programme Missing Key Subcontractor Milestones", type: "Programme", severity: "Medium", sourceDoc: "Schedule_Glasgow.xlsx", sourceRef: "Overall Schedule - Lacking Detail", notes: "Integrate subcontractor programmes." },
  { id: 8, projectId: 4, title: "Statutory Approval Delays for Height Variance", type: "Statutory", severity: "High", sourceDoc: "Full_Contract_Set.pdf", sourceRef: "Planning Application Docs", notes: "Liaise with planning authority, prepare mitigation strategy." },
  { id: 9, projectId: 4, title: "Unexpected Ground Conditions (Rock)", type: "Ground", severity: "Medium", sourceDoc: "Geotechnical_Report.pdf", sourceRef: "Borehole Log BH-04", notes: "Re-evaluate excavation plant and time." },
  { id: 10, projectId: 4, title: "Interface Clash Between MEP and Structural", type: "Design", severity: "High", sourceDoc: "Full_Contract_Set.pdf", sourceRef: "Combined Services Drawings Rev B", notes: "BIM coordination meeting to resolve clashes." }
];

const riskTypes = ["All", "Design", "Programme", "Access", "Statutory", "Ground", "Commercial", "Contractual"];
const severities = ["All", "Low", "Medium", "High"];

const RISK_TYPE_COLORS = {
  "Design": "#8884d8",
  "Programme": "#82ca9d",
  "Access": "#ffc658",
  "Statutory": "#ff7300",
  "Ground": "#a4de6c",
  "Commercial": "#d0ed57",
  "Contractual": "#ff8042",
  "Other": "#888888"
};

// Helper function for severity badge
const SeverityBadge = ({ severity }) => {
  let bgColor, textColor, Icon;
  switch (severity?.toLowerCase()) {
    case 'high': bgColor = 'bg-red-100'; textColor = 'text-red-700'; Icon = AlertTriangle; break;
    case 'medium': bgColor = 'bg-yellow-100'; textColor = 'text-yellow-700'; Icon = ShieldAlert; break;
    case 'low': bgColor = 'bg-green-100'; textColor = 'text-green-700'; Icon = ShieldCheck; break;
    default: bgColor = 'bg-gray-100'; textColor = 'text-gray-700'; Icon = ShieldQuestion; return null; 
  }
  return (
    <span className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
      <Icon size={14} className="mr-1.5" /> {severity}
    </span>
  );
};

// Custom Dropdown Component
const CustomDropdown = ({ options, selected, onSelect, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const IconComponent = icon;
  return (
    <div className="relative inline-block text-left w-full md:w-auto">
      <div>
        <button type="button"
          className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 items-center"
          onClick={() => setIsOpen(!isOpen)} >
          {IconComponent && <IconComponent size={16} className="mr-2 text-gray-500" />}
          {selected || placeholder}
          {isOpen ? <ChevronUp size={20} className="ml-2 -mr-1 h-5 w-5" /> : <ChevronDown size={20} className="ml-2 -mr-1 h-5 w-5" />}
        </button>
      </div>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {options.map((option) => (
              <a key={option} href="#"
                className={`block px-4 py-2 text-sm ${selected === option ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                role="menuitem"
                onClick={(e) => { e.preventDefault(); onSelect(option); setIsOpen(false); }} >
                {option}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Login Page Component
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (email && password) { onLogin(); } else { console.warn("Email and password are required"); } };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col justify-center items-center p-4 font-inter">
      <div className="bg-white p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8"> <Briefcase size={48} className="mx-auto text-indigo-600 mb-4" /> <h1 className="text-3xl font-bold text-gray-800">Sign In to Risk Dashboard</h1> </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div> <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1"> Email Address </label> <div className="relative"> <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <User size={20} className="text-gray-400" /> </div> <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="you@example.com" /> </div> </div>
          <div> <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1"> Password </label> <div className="relative"> <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <Lock size={20} className="text-gray-400" /> </div> <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="••••••••" /> </div> </div>
          <div> <button type="submit" className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"> <LogIn size={20} className="mr-2" /> Login </button> </div>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500"> Demo login — authentication not yet connected. </p>
      </div>
      <footer className="text-center text-sm text-slate-400 mt-8"> Construction Risk Dashboard &copy; {new Date().getFullYear()} </footer>
    </div>
  );
};

// Dashboard Page Component
const DashboardPage = ({ projects, onSelectProject, onLogout, onAddProject }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState({text: '', type: ''});

  const handleFileChange = (e) => {
    const files = [...e.target.files];
    processFiles(files);
  };

  const processFiles = (files) => {
    if (files && files.length > 0) {
      const newFiles = files.map(file => ({ name: file.name, type: file.type, size: file.size }));
      setUploadedFiles(prevFiles => [...prevFiles, ...newFiles].slice(0, 5)); 
      setFeedbackMessage({text: '', type: ''});
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    processFiles([...e.dataTransfer.files]);
  };
  
  const removeFile = (fileName) => {
    setUploadedFiles(prevFiles => prevFiles.filter(f => f.name !== fileName));
  };

  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) {
      setFeedbackMessage({text: 'Project Title is required.', type: 'error'});
      return;
    }
    if (uploadedFiles.length === 0) {
      setFeedbackMessage({text: 'Please upload at least one document.', type: 'error'});
      return;
    }

    const newProject = {
      id: Date.now(), 
      title: newProjectTitle.trim(),
      uploadDate: new Date().toISOString().split('T')[0], 
      risksDetected: Math.floor(Math.random() * 10) +1, 
      documents: uploadedFiles.map(f => f.name),
    };
    onAddProject(newProject);
    setNewProjectTitle('');
    setUploadedFiles([]);
    setFeedbackMessage({text: `Project "${newProject.title}" created successfully!`, type: 'success'});
    setTimeout(() => setFeedbackMessage({text:'', type:''}), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-inter">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Your Projects</h1>
        <button onClick={onLogout} className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 rounded-md transition"> Logout </button>
      </header>

      <div className="mb-10 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-1">Create New Project & Upload Documents</h2>
        <p className="text-sm text-gray-500 mb-4">Enter a project title and upload relevant contract documents (PDF, Word, Excel).</p>
        
        <div className="mb-4">
          <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-1"> Project Title <span className="text-red-500">*</span> </label>
          <input type="text" id="projectTitle" value={newProjectTitle} onChange={(e) => setNewProjectTitle(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Manchester Hospital Wing Extension" />
        </div>

        <div className={`border-2 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'} rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ease-in-out`}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} >
          <UploadCloud size={48} className={`mx-auto mb-4 ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`} />
          <p className={`text-lg font-medium ${isDragging ? 'text-indigo-700' : 'text-gray-600'}`}>
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Max 5 files. PDF, DOCX, XLSX supported.</p>
          <input type="file" multiple className="hidden" onChange={handleFileChange} id="fileUploadInput" accept=".pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          <label htmlFor="fileUploadInput" className="mt-4 inline-block px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-600 cursor-pointer"> Select Files </label>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">Staged files for new project:</h3>
            <ul className="mt-2 space-y-1">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md flex justify-between items-center">
                  <span className="truncate max-w-[80%]">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button onClick={() => removeFile(file.name)} className="text-red-500 hover:text-red-700"> <XCircle size={16} /> </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {feedbackMessage.text && (
          <p className={`mt-3 text-sm ${feedbackMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {feedbackMessage.text}
          </p>
        )}

        <button onClick={handleCreateProject}
          disabled={!newProjectTitle.trim() || uploadedFiles.length === 0}
          className="mt-6 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition" >
          <PlusCircle size={20} className="mr-2" /> Create Project & Upload Files
        </button>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Existing Projects</h2>
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onSelectProject={onSelectProject} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No projects yet. Create one above to get started!</p>
        </div>
      )}
       <footer className="text-center text-sm text-gray-500 mt-12 py-4 border-t border-gray-200"> Construction Risk Dashboard &copy; {new Date().getFullYear()} </footer>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, onSelectProject }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex items-start justify-between mb-3"> <Briefcase size={28} className="text-indigo-500" /> <span className="text-xs text-gray-500">{project.uploadDate}</span> </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={project.title}>{project.title}</h3>
        <div className="flex items-center text-sm text-gray-600 mb-4"> <AlertTriangle size={16} className="mr-2 text-red-500" /> <span>{project.risksDetected} Risks Detected</span> </div>
        <div className="text-xs text-gray-500 mb-1">Documents:</div>
        <ul className="space-y-1 mb-4">
            {project.documents.slice(0,2).map(doc => ( <li key={doc} className="flex items-center text-xs text-gray-600"> <FileText size={14} className="mr-1.5 text-gray-400 flex-shrink-0" /> <span className="truncate" title={doc}>{doc}</span> </li> ))}
            {project.documents.length > 2 && <li className="text-xs text-gray-500 italic ml-5">...and {project.documents.length - 2} more</li>}
        </ul>
      </div>
      <div className="bg-gray-50 p-4"> <button onClick={() => onSelectProject(project)} className="w-full bg-indigo-500 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center"> View Risks <ChevronDown size={16} className="ml-2 transform -rotate-90" /> </button> </div>
    </div>
  );
};

// Risk Detail Modal Component
const RiskDetailModal = ({ risk, onClose }) => {
  if (!risk) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4"> <h2 className="text-xl font-semibold text-gray-800 flex items-center"> <Info size={24} className="mr-2 text-indigo-600" /> Risk Details </h2> <button onClick={onClose} className="text-gray-400 hover:text-gray-600"> <XCircle size={24} /> </button> </div>
        <div className="space-y-4">
          <div> <h3 className="text-sm font-medium text-gray-500">Risk Title</h3> <p className="text-lg text-gray-800 font-semibold">{risk.title}</p> </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <h3 className="text-sm font-medium text-gray-500">Risk Type</h3> <p className="text-gray-700">{risk.type}</p> </div> <div> <h3 className="text-sm font-medium text-gray-500">Severity</h3> <SeverityBadge severity={risk.severity} /> </div> </div>
          <div> <h3 className="text-sm font-medium text-gray-500">Source Document & Page/Section</h3> <p className="text-gray-700 flex items-center"> <FileUp size={16} className="mr-1.5 text-gray-400" /> {risk.sourceDoc}, {risk.sourceRef} </p> </div>
          <div> <h3 className="text-sm font-medium text-gray-500">Notes / Actions</h3> <p className="text-gray-700 bg-slate-50 p-3 rounded-md whitespace-pre-wrap">{risk.notes || "No notes available."}</p> </div>
        </div>
        <div className="mt-6 text-right"> <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"> Close </button> </div>
      </div>
    </div>
  );
};

// Project View Page Component
const ProjectViewPage = ({ project, risks, onBackToDashboard, onLogout, onAddDocuments }) => {
  const [currentRisks, setCurrentRisks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskType, setSelectedRiskType] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedDocument, setSelectedDocument] = useState('All');
  const [editingNotes, setEditingNotes] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRiskForModal, setSelectedRiskForModal] = useState(null);

  // State for additional document uploads
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [isAddingDocsDragging, setIsAddingDocsDragging] = useState(false);
  const [addDocsFeedback, setAddDocsFeedback] = useState({text: '', type: ''});


  const projectDocuments = useMemo(() => {
    // Ensure project and project.documents exist before creating the Set
    if (project && project.documents) {
      return ['All', ...new Set(project.documents)];
    }
    return ['All']; // Fallback if project or project.documents is undefined
  }, [project]);


  useEffect(() => {
    let projectSpecificRisks = risks.filter(risk => risk.projectId === project?.id);
    let filteredRisks = projectSpecificRisks;

    if (selectedRiskType !== 'All') {
      filteredRisks = filteredRisks.filter(risk => risk.type === selectedRiskType);
    }
    if (selectedSeverity !== 'All') {
      filteredRisks = filteredRisks.filter(risk => risk.severity === selectedSeverity);
    }
    // Check if selectedDocument is valid and part of the project's documents before filtering
    if (selectedDocument !== 'All' && project?.documents?.includes(selectedDocument)) {
      filteredRisks = filteredRisks.filter(risk => risk.sourceDoc === selectedDocument);
    } else if (selectedDocument !== 'All' && !project?.documents?.includes(selectedDocument)) {
      // If a document filter is selected but no longer valid (e.g., after project doc list changes), reset or handle
      // For now, this implies no filtering by this invalid document. Or, one could reset selectedDocument to 'All'.
      // This case should be less likely if projectDocuments updates correctly.
    }
    
    if (searchTerm) {
      filteredRisks = filteredRisks.filter(risk =>
        risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (risk.notes && risk.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setCurrentRisks(filteredRisks);
  }, [project, risks, searchTerm, selectedRiskType, selectedSeverity, selectedDocument]);

  const handleNoteChange = (riskId, newNote) => setEditingNotes(prev => ({ ...prev, [riskId]: newNote }));
  const handleSaveNote = (riskId) => {
    const riskIndex = mockRisksData.findIndex(r => r.id === riskId);
    if (riskIndex !== -1) mockRisksData[riskIndex].notes = editingNotes[riskId];
    const newEditingNotes = {...editingNotes}; delete newEditingNotes[riskId]; setEditingNotes(newEditingNotes);
    setCurrentRisks(prevRisks => prevRisks.map(r => r.id === riskId ? {...r, notes: editingNotes[riskId]} : r));
  };
  const handleRiskTitleClick = (risk) => { setSelectedRiskForModal(risk); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedRiskForModal(null); };
  
  const riskTypeDistribution = useMemo(() => {
    if (!currentRisks || currentRisks.length === 0) return [];
    const counts = currentRisks.reduce((acc, risk) => {
      acc[risk.type] = (acc[risk.type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [currentRisks]);

  // Handlers for adding more documents
  const handleAdditionalFileChange = (e) => {
    const files = [...e.target.files];
    processAdditionalFiles(files);
  };

  const processAdditionalFiles = (files) => {
    if (files && files.length > 0) {
      const newFiles = files.map(file => ({ name: file.name, type: file.type, size: file.size }));
      setAdditionalFiles(prevFiles => [...prevFiles, ...newFiles].slice(0, 3)); // Limit to 3 additional for demo
      setAddDocsFeedback({text: '', type: ''});
    }
  };

  const handleAdditionalDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsAddingDocsDragging(true); };
  const handleAdditionalDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsAddingDocsDragging(false); };
  const handleAdditionalDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleAdditionalDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsAddingDocsDragging(false);
    processAdditionalFiles([...e.dataTransfer.files]);
  };

  const removeAdditionalFile = (fileName) => {
    setAdditionalFiles(prevFiles => prevFiles.filter(f => f.name !== fileName));
  };

  const handleUploadAdditionalDocs = () => {
    if (additionalFiles.length === 0) {
      setAddDocsFeedback({text: "Please select files to add.", type: "error"});
      return;
    }
    const newDocumentNames = additionalFiles.map(f => f.name);
    onAddDocuments(project.id, newDocumentNames);
    setAdditionalFiles([]);
    setAddDocsFeedback({text: `${newDocumentNames.length} document(s) added to project. Filter list updated.`, type: "success"});
    setTimeout(() => setAddDocsFeedback({text:'', type:''}), 4000);
  };


  if (!project) {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
        <p className="text-gray-600">No project selected or project data is unavailable.</p>
        <button onClick={onBackToDashboard} className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"> Back to Dashboard </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-inter">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
            <button onClick={onBackToDashboard} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 sm:mb-0 flex items-center"> <ChevronDown size={18} className="mr-1 transform rotate-90" /> Back to Dashboard </button>
            <h1 className="text-3xl font-bold text-gray-800 truncate" title={project.title}>{project.title} – Risk Register</h1>
        </div>
        <button onClick={onLogout} className="mt-2 sm:mt-0 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 rounded-md transition"> Logout </button>
      </header>

      {/* Risk Distribution Pie Chart */}
      {riskTypeDistribution.length > 0 ? (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"> <PieChartIcon size={22} className="mr-2 text-indigo-600" /> Risk Type Distribution </h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskTypeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false}
                     label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (percent * 100) > 5 ? (
                          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }} >
                  {riskTypeDistribution.map((entry, index) => ( <Cell key={`cell-${index}`} fill={RISK_TYPE_COLORS[entry.name] || RISK_TYPE_COLORS["Other"]} /> ))}
                </Pie>
                <RechartsTooltip wrapperStyle={{ fontSize: '12px', borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-lg text-center">
            <PieChartIcon size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No risk data available to display chart for the current filters.</p>
        </div>
      )}
      
      {/* Filters Section */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <CustomDropdown icon={FileText} options={projectDocuments} selected={selectedDocument} onSelect={setSelectedDocument} placeholder="Source Document" />
          <CustomDropdown icon={Filter} options={riskTypes} selected={selectedRiskType} onSelect={setSelectedRiskType} placeholder="Risk Type" />
          <CustomDropdown icon={AlertTriangle} options={severities} selected={selectedSeverity} onSelect={setSelectedSeverity} placeholder="Severity" />
          <div className="relative"> <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <Search size={20} className="text-gray-400" /> </div> <input type="text" placeholder="Search Risks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /> </div>
        </div>
      </div>

      {/* Risk Summary Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Document & Page/Section</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes / Actions</th>
              <th scope="col" className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRisks.length > 0 ? currentRisks.map((risk) => (
              <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer max-w-xs truncate" title={risk.title} onClick={() => handleRiskTitleClick(risk)}>{risk.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{risk.type}</td>
                <td className="px-6 py-4 whitespace-nowrap"><SeverityBadge severity={risk.severity} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><div className="truncate max-w-xs" title={`${risk.sourceDoc}, ${risk.sourceRef}`}><FileUp size={14} className="inline mr-1.5 text-gray-400" />{risk.sourceDoc}, {risk.sourceRef}</div></td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">{editingNotes.hasOwnProperty(risk.id) ? (<textarea value={editingNotes[risk.id]} onChange={(e) => handleNoteChange(risk.id, e.target.value)} className="w-full p-1 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" rows="2" />) : (<p className="truncate" title={risk.notes}>{risk.notes || "No notes yet."}</p>)}</td>
                <td className="px-1 py-4 whitespace-nowrap text-sm font-medium">{editingNotes.hasOwnProperty(risk.id) ? (<button onClick={() => handleSaveNote(risk.id)} className="text-green-600 hover:text-green-800 p-1 rounded-md bg-green-100 hover:bg-green-200">Save</button>) : (<button onClick={() => handleNoteChange(risk.id, risk.notes || "")} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-100"><Edit3 size={18} /></button>)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500"><Search size={32} className="mx-auto text-gray-400 mb-2" />No risks match your current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add More Documents Section */}
      <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Add More Documents to This Project</h3>
        <div
          className={`border-2 ${isAddingDocsDragging ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'} rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ease-in-out`}
          onDragEnter={handleAdditionalDragEnter} onDragLeave={handleAdditionalDragLeave} onDragOver={handleAdditionalDragOver} onDrop={handleAdditionalDrop}
        >
          <UploadCloud size={40} className={`mx-auto mb-3 ${isAddingDocsDragging ? 'text-indigo-600' : 'text-gray-400'}`} />
          <p className={`text-md font-medium ${isAddingDocsDragging ? 'text-indigo-700' : 'text-gray-600'}`}>
            {isAddingDocsDragging ? 'Drop files here' : 'Drag & drop or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Max 3 files. PDF, DOCX, XLSX supported.</p>
          <input type="file" multiple className="hidden" onChange={handleAdditionalFileChange} id="additionalFileUploadInput" accept=".pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          <label htmlFor="additionalFileUploadInput" className="mt-3 inline-block px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-md hover:bg-indigo-600 cursor-pointer">
            Select Files
          </label>
        </div>
        {additionalFiles.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-600">Staged files to add:</h4>
            <ul className="mt-1 space-y-1">
              {additionalFiles.map((file, index) => (
                <li key={index} className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded-md flex justify-between items-center">
                  <span className="truncate max-w-[80%]">{file.name}</span>
                  <button onClick={() => removeAdditionalFile(file.name)} className="text-red-500 hover:text-red-700 ml-2"> <XCircle size={14} /> </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {addDocsFeedback.text && (
          <p className={`mt-2 text-xs ${addDocsFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {addDocsFeedback.text}
          </p>
        )}
        <button onClick={handleUploadAdditionalDocs}
          disabled={additionalFiles.length === 0}
          className="mt-4 w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          <FileUp size={18} className="mr-2" /> Add Selected Files to Project
        </button>
      </div>


      {/* Export Section */}
      <div className="mt-8 text-center"> <button className="bg-slate-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center mx-auto"> <Download size={18} className="mr-2" /> Export Summary (CSV/PDF) </button> <p className="mt-2 text-xs text-gray-500">Coming soon — export project risk register</p> </div>
      <footer className="text-center text-sm text-gray-500 mt-12 py-4 border-t border-gray-200"> Construction Risk Dashboard &copy; {new Date().getFullYear()} </footer>
      {isModalOpen && <RiskDetailModal risk={selectedRiskForModal} onClose={handleCloseModal} />}
    </div>
  );
};

// Main App Component
export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState(initialMockProjectsData);
  const [risks, setRisks] = useState(mockRisksData);

  const handleLogin = () => setCurrentPage('dashboard');
  const handleLogout = () => { setSelectedProject(null); setCurrentPage('login'); }
  
  const handleAddProject = (newProject) => {
    setProjects(prevProjects => [...prevProjects, newProject]);
  };

  const handleAddDocumentsToProject = (projectId, newDocumentNames) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          // Ensure no duplicate document names are added
          const updatedDocs = [...new Set([...p.documents, ...newDocumentNames])];
          return { ...p, documents: updatedDocs };
        }
        return p;
      })
    );
    // If the currently selected project is the one being updated,
    // we need to update selectedProject state as well to trigger re-render with new docs in ProjectViewPage
    if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(prevSelected => {
            if (!prevSelected) return null;
            const updatedDocs = [...new Set([...prevSelected.documents, ...newDocumentNames])];
            return {...prevSelected, documents: updatedDocs};
        });
    }
  };

  const handleSelectProject = (project) => { 
    setSelectedProject(project); 
    setCurrentPage('projectView'); 
  };
  const handleBackToDashboard = () => { setSelectedProject(null); setCurrentPage('dashboard'); };

  switch (currentPage) {
    case 'login': return <LoginPage onLogin={handleLogin} />;
    case 'dashboard': return <DashboardPage projects={projects} onSelectProject={handleSelectProject} onLogout={handleLogout} onAddProject={handleAddProject} />;
    case 'projectView': return <ProjectViewPage project={selectedProject} risks={risks} onBackToDashboard={handleBackToDashboard} onLogout={handleLogout} onAddDocuments={handleAddDocumentsToProject} />;
    default: return <LoginPage onLogin={handleLogin} />;
  }
}
