// Admin credentials (in a real app, this would be server-side)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'cse24admin'
};

// Events data (shared with main page)
let eventsArray = [];

// Courses data
let coursesArray = [];

// Notices data
let noticesArray = [];

// Extra classes data
let extraClassesArray = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const eventsList = document.getElementById('eventsList');
const addEventBtn = document.getElementById('addEventBtn');
const eventModal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');
const modalTitle = document.getElementById('modalTitle');
const closeEventModal = document.getElementById('closeEventModal');
const cancelEvent = document.getElementById('cancelEvent');
const backToMain = document.getElementById('backToMain');
const logoutBtn = document.getElementById('logoutBtn');

// Courses DOM Elements
const coursesList = document.getElementById('coursesList');
const addCourseBtn = document.getElementById('addCourseBtn');
const addNoteBtn = document.getElementById('addNoteBtn');
const addSlideBtn = document.getElementById('addSlideBtn');
const addStudentNoteBtn = document.getElementById('addStudentNoteBtn');
const courseModal = document.getElementById('courseModal');
const courseForm = document.getElementById('courseForm');
const courseModalTitle = document.getElementById('courseModalTitle');
const closeCourseModal = document.getElementById('closeCourseModal');
const cancelCourse = document.getElementById('cancelCourse');
const noteModal = document.getElementById('noteModal');
const noteForm = document.getElementById('noteForm');
const noteModalTitle = document.getElementById('noteModalTitle');
const closeNoteModal = document.getElementById('closeNoteModal');
const cancelNote = document.getElementById('cancelNote');
const noteCourseSelect = document.getElementById('noteCourse');
const noteTypeSelect = document.getElementById('noteType');
const noteSectionSelect = document.getElementById('noteSection');

// Notices DOM Elements
const noticesList = document.getElementById('noticesList');
const addNoticeBtn = document.getElementById('addNoticeBtn');
const noticeModal = document.getElementById('noticeModal');
const noticeForm = document.getElementById('noticeForm');
const noticeModalTitle = document.getElementById('noticeModalTitle');
const closeNoticeModal = document.getElementById('closeNoticeModal');
const cancelNotice = document.getElementById('cancelNotice');
const addAttachmentBtn = document.getElementById('addAttachmentBtn');
const attachmentsList = document.getElementById('attachmentsList');

// Extra Classes DOM Elements
const extraClassesList = document.getElementById('extraClassesList');
const addExtraClassBtn = document.getElementById('addExtraClassBtn');
const extraClassModal = document.getElementById('extraClassModal');
const extraClassForm = document.getElementById('extraClassForm');
const extraClassModalTitle = document.getElementById('extraClassModalTitle');
const closeExtraClassModal = document.getElementById('closeExtraClassModal');
const cancelExtraClass = document.getElementById('cancelExtraClass');

// Current editing items
let currentEditingEvent = null;
let currentEditingCourse = null;
let currentEditingNote = null;
let currentEditingNotice = null;
let currentEditingExtraClass = null;

// Login functionality
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        loadEvents();
        loadCourses();
        loadNotices();
        loadExtraClasses(); // Added loadExtraClasses
        loginError.textContent = '';
    } else {
        loginError.textContent = 'Invalid username or password!';
    }
});

// Load events in admin panel
function loadEvents() {
    eventsList.innerHTML = '';
    
    eventsArray.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        
        eventItem.innerHTML = `
            <div class="event-header">
                <div class="event-title">${event.title}</div>
                ${event.urgent ? '<span class="event-urgent-badge">URGENT</span>' : ''}
            </div>
            <div class="event-details">
                <div class="event-detail">📅 ${formatDate(event.date)} ${event.time ? `⏰ ${event.time}` : ''}</div>
                <div class="event-detail">⏱️ ${event.details[0]}</div>
                <div class="event-detail">📊 ${event.details[1]}</div>
                <div class="event-detail">🏢 ${event.details[2]}</div>
            </div>
            <div class="event-description">${event.description}</div>
            <div class="event-actions">
                <button class="edit-btn" data-event-id="${event.id}">Edit</button>
                <button class="delete-btn" data-event-id="${event.id}">Delete</button>
            </div>
        `;
        
        // Add event listeners to the buttons
        const editBtn = eventItem.querySelector('.edit-btn');
        const deleteBtn = eventItem.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => editEvent(event.id));
        deleteBtn.addEventListener('click', () => deleteEvent(event.id));
        
        eventsList.appendChild(eventItem);
    });
}

// Load courses in admin panel
async function loadCourses() {
    try {
        const snapshot = await db.collection('courses').orderBy('code', 'asc').get();
        coursesArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCoursesList();
        populateCourseSelect();
    } catch (err) {
        console.error('Error loading courses:', err);
        coursesArray = [];
        renderCoursesList();
    }
}

// Render courses list in admin panel
async function renderCoursesList() {
    coursesList.innerHTML = '';
    
    if (!coursesArray.length) {
        coursesList.innerHTML = '<div class="no-courses-message">No courses available yet.</div>';
        return;
    }
    
    for (const course of coursesArray) {
        const courseItem = document.createElement('div');
        courseItem.className = 'course-item';
        
        // Load resources for this course
        const resourceTypes = ['notes', 'slides', 'student-notes'];
        const resourcesData = {};
        
        for (const resourceType of resourceTypes) {
            try {
                const snapshot = await db.collection('courses').doc(course.id).collection(resourceType).orderBy('createdAt', 'desc').get();
                resourcesData[resourceType] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (err) {
                console.error(`Error loading ${resourceType} for course`, course.id, err);
                resourcesData[resourceType] = [];
            }
        }
        
        // Calculate total resources count
        const totalResources = Object.values(resourcesData).reduce((sum, resources) => sum + resources.length, 0);
        
        const resourcesHtml = Object.keys(resourcesData).some(type => resourcesData[type].length > 0) ? `
            <div class="notes-preview">
                <div class="resources-header">
                    <h4>Resources (${totalResources})</h4>
                    <button class="toggle-resources-btn" data-course-id="${course.id}">Show Resources</button>
                </div>
                <div class="notes-list expandable collapsed" id="resources-${course.id}">
                    ${resourceTypes.map(type => {
                        const resources = resourcesData[type];
                        if (resources.length === 0) return '';
                        
                        const typeName = type === 'notes' ? '📝 Notes' : 
                                        type === 'slides' ? '📊 Slides' : '👨‍🎓 Student Notes';
                        
                        return `
                            <div style="margin-bottom: 15px;">
                                <div style="color: #00d4ff; font-size: 13px; font-weight: 600; margin-bottom: 8px;">${typeName} (${resources.length})</div>
                                ${resources.map(resource => `
                                    <div class="note-preview-item">
                                        <div class="note-title">${resource.title || 'Untitled'} ${resource.section ? `<span style="color: #00d4ff; font-size: 10px;">(Section ${resource.section})</span>` : ''}</div>
                                        <div class="note-actions">
                                            <button class="edit-note-btn" data-course-id="${course.id}" data-note-id="${resource.id}" data-resource-type="${type}">Edit</button>
                                            <button class="delete-note-btn" data-course-id="${course.id}" data-note-id="${resource.id}" data-resource-type="${type}">Delete</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : '';
        
        courseItem.innerHTML = `
            <div class="course-header">
                <div class="course-info">
                    <h3>${course.code || 'COURSE'} — ${course.title || ''}</h3>
                    <p>Instructor: ${course.instructor || 'Not specified'}</p>
                </div>
                <div class="course-actions">
                    <button class="edit-btn" data-course-id="${course.id}">Edit</button>
                    <button class="delete-btn" data-course-id="${course.id}">Delete</button>
                </div>
            </div>
            ${resourcesHtml}
        `;
        
        // Add event listeners
        const editBtn = courseItem.querySelector('.edit-btn');
        const deleteBtn = courseItem.querySelector('.delete-btn');
        const editNoteBtns = courseItem.querySelectorAll('.edit-note-btn');
        const deleteNoteBtns = courseItem.querySelectorAll('.delete-note-btn');
        const toggleBtn = courseItem.querySelector('.toggle-resources-btn');
        
        editBtn.addEventListener('click', () => editCourse(course.id));
        deleteBtn.addEventListener('click', () => deleteCourse(course.id));
        
        editNoteBtns.forEach(btn => {
            btn.addEventListener('click', () => editNote(btn.dataset.courseId, btn.dataset.noteId, btn.dataset.resourceType));
        });
        
        deleteNoteBtns.forEach(btn => {
            btn.addEventListener('click', () => deleteNote(btn.dataset.courseId, btn.dataset.noteId, btn.dataset.resourceType));
        });
        
        // Toggle resources visibility
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const resourcesList = document.getElementById(`resources-${course.id}`);
                const isVisible = !resourcesList.classList.contains('collapsed');
                
                if (isVisible) {
                    resourcesList.classList.add('collapsed');
                    toggleBtn.textContent = 'Show Resources';
                } else {
                    resourcesList.classList.remove('collapsed');
                    toggleBtn.textContent = 'Hide Resources';
                }
            });
        }
        
        coursesList.appendChild(courseItem);
    }
}

// Populate course select dropdown for notes
function populateCourseSelect() {
    noteCourseSelect.innerHTML = '<option value="">Choose a course...</option>';
    coursesArray.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.code || 'COURSE'} — ${course.title || ''}`;
        noteCourseSelect.appendChild(option);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Add new event
addEventBtn.addEventListener('click', () => {
    currentEditingEvent = null;
    modalTitle.textContent = 'Add New Event';
    eventForm.reset();
    eventModal.style.display = 'flex';
});

// Edit event
function editEvent(eventId) {
    const event = eventsArray.find(e => e.id === eventId);
    if (event) {
        currentEditingEvent = event;
        modalTitle.textContent = 'Edit Event';
        
        // Fill form with event data
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('eventDuration').value = event.details[0].replace('Duration: ', '');
        document.getElementById('eventMarks').value = event.details[1].replace('Total Marks: ', '');
        document.getElementById('eventRoom').value = event.details[2].replace('Room: ', '');
        document.getElementById('eventUrgent').checked = event.urgent;
        
        eventModal.style.display = 'flex';
    }
}

// Delete event
function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        console.log('Attempting to delete event with ID:', eventId);
        console.log('Current events array:', eventsArray);
        
        const eventToDelete = eventsArray.find(e => e.id == eventId);
        if (eventToDelete) {
            console.log('Found event to delete:', eventToDelete);
            eventsArray = eventsArray.filter(e => e.id != eventId);
            console.log('Events array after deletion:', eventsArray);
            loadEvents();
            saveEventsToFirebase();
        } else {
            console.log('Event not found with ID:', eventId);
            alert('Event not found. Please refresh the page and try again.');
        }
    }
}

// Save event (add or edit)
eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById('eventTitle').value.trim(),
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        duration: document.getElementById('eventDuration').value.trim(),
        marks: document.getElementById('eventMarks').value.trim(),
        room: document.getElementById('eventRoom').value.trim(),
        urgent: document.getElementById('eventUrgent').checked
    };
    
    // Validate required fields
    if (!eventData.title || !eventData.date || !eventData.description || !eventData.duration || !eventData.marks || !eventData.room) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Validate date format
    if (!eventData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        alert('Please enter a valid date in YYYY-MM-DD format.');
        return;
    }
    
    if (currentEditingEvent) {
        // Edit existing event
        const index = eventsArray.findIndex(e => e.id === currentEditingEvent.id);
        if (index !== -1) {
            eventsArray[index] = {
                ...currentEditingEvent,
                title: eventData.title,
                date: eventData.date,
                time: eventData.time,
                description: eventData.description,
                details: [
                    `Duration: ${eventData.duration}`,
                    `Total Marks: ${eventData.marks}`,
                    `Room: ${eventData.room}`
                ],
                urgent: eventData.urgent
            };
        }
    } else {
        // Add new event
        const newEvent = {
            id: `temp_${Date.now()}`, // Temporary ID for new events
            title: eventData.title,
            date: eventData.date,
            time: eventData.time,
            description: eventData.description,
            details: [
                `Duration: ${eventData.duration}`,
                `Total Marks: ${eventData.marks}`,
                `Room: ${eventData.room}`
            ],
            urgent: eventData.urgent
        };
        eventsArray.push(newEvent);
    }
    
    loadEvents();
    saveEventsToFirebase();
    closeEventModalFunc();
});

// Close event modal
function closeEventModalFunc() {
    eventModal.style.display = 'none';
    currentEditingEvent = null;
    eventForm.reset();
}

closeEventModal.addEventListener('click', closeEventModalFunc);
cancelEvent.addEventListener('click', closeEventModalFunc);

// Close modal when clicking outside
eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) {
        closeEventModalFunc();
    }
});

// Back to main page
backToMain.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Logout
logoutBtn.addEventListener('click', () => {
    adminDashboard.style.display = 'none';
    loginScreen.style.display = 'flex';
    loginForm.reset();
    loginError.textContent = '';
});

// Save events to Firebase
async function saveEventsToFirebase() {
    try {
        console.log('Saving events to Firebase...', eventsArray);
        
        // Clear existing events
        const snapshot = await db.collection('events').get();
        if (snapshot.docs.length > 0) {
            const deleteBatch = db.batch();
            snapshot.docs.forEach(doc => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            console.log('Cleared existing events');
        }

        // Add all current events (handle in batches if needed)
        if (eventsArray.length > 0) {
            // Firestore batch limit is 500 operations
            const batchSize = 400; // Safe limit
            const batches = [];
            
            for (let i = 0; i < eventsArray.length; i += batchSize) {
                const batch = db.batch();
                const chunk = eventsArray.slice(i, i + batchSize);
                
                chunk.forEach(event => {
                    const docRef = db.collection('events').doc();
                    batch.set(docRef, {
                        title: event.title,
                        date: event.date,
                        time: event.time,
                        description: event.description,
                        details: event.details,
                        urgent: event.urgent
                    });
                });
                
                batches.push(batch);
            }
            
            // Commit all batches
            for (const batch of batches) {
                await batch.commit();
            }
        }
        
        console.log('Events saved to Firebase successfully');
        
        // Reload events to get proper Firebase IDs
        await loadEventsFromFirebase();
        
    } catch (error) {
        console.error('Error saving events to Firebase:', error);
        alert('Error saving events. Please try again. Error: ' + error.message);
    }
}

// Load default events (fallback)
function loadDefaultEvents() {
    eventsArray = [
        {
            id: 1,
            title: "Data Structures CT",
            date: "2024-12-15",
            time: "10:00",
            description: "Class Test on Data Structures and Algorithms. Topics: Arrays, Linked Lists, Stacks, Queues, Trees, and Graphs.",
            details: ["Duration: 2 hours", "Total Marks: 50", "Room: 301"],
            urgent: true
        },
        {
            id: 2,
            title: "Database Management CT",
            date: "2024-12-20",
            time: "14:30",
            description: "Class Test on Database Management Systems. Topics: SQL, Normalization, ER Diagrams, and Transaction Management.",
            details: ["Duration: 1.5 hours", "Total Marks: 40", "Room: 302"],
            urgent: false
        },
        {
            id: 3,
            title: "Computer Networks CT",
            date: "2024-12-25",
            time: "11:00",
            description: "Class Test on Computer Networks. Topics: OSI Model, TCP/IP, Network Protocols, and Network Security.",
            details: ["Duration: 2 hours", "Total Marks: 50", "Room: 303"],
            urgent: false
        },
        {
            id: 4,
            title: "Software Engineering CT",
            date: "2024-12-30",
            time: "15:00",
            description: "Class Test on Software Engineering. Topics: SDLC, UML Diagrams, Design Patterns, and Testing.",
            details: ["Duration: 1.5 hours", "Total Marks: 45", "Room: 304"],
            urgent: false
        },
        {
            id: 5,
            title: "Operating Systems CT",
            date: "2025-01-05",
            time: "09:30",
            description: "Class Test on Operating Systems. Topics: Process Management, Memory Management, File Systems, and Deadlocks.",
            details: ["Duration: 2 hours", "Total Marks: 50", "Room: 305"],
            urgent: false
        }
    ];
}

// Load events from Firebase
async function loadEventsFromFirebase() {
    try {
        console.log('Loading events from Firebase...');
        
        // Delete expired events first
        await deleteExpiredItems();
        
        const snapshot = await db.collection('events').orderBy('date', 'asc').get();
        eventsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Loaded ${eventsArray.length} events from Firebase`);
        loadEvents();
    } catch (error) {
        console.error('Error loading events from Firebase:', error);
        // Fallback to default events if Firebase fails
        console.log('Falling back to default events...');
        loadDefaultEvents();
        loadEvents();
    }
}

// Load notices in admin panel
async function loadNotices() {
    try {
        const snapshot = await db.collection('notices').orderBy('createdAt', 'desc').get();
        noticesArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderNoticesList();
    } catch (err) {
        console.error('Error loading notices:', err);
        noticesArray = [];
        renderNoticesList();
    }
}

// Render notices list in admin panel
function renderNoticesList() {
    noticesList.innerHTML = '';
    
    if (!noticesArray.length) {
        noticesList.innerHTML = '<div class="no-notices-message">No notices available yet.</div>';
        return;
    }
    
    noticesArray.forEach(notice => {
        const noticeItem = document.createElement('div');
        noticeItem.className = `notice-admin-item ${notice.category === 'urgent' ? 'urgent' : ''}`;
        
        const attachmentsHtml = notice.attachments && notice.attachments.length > 0 ? `
            <div class="notice-admin-attachments">
                <h4>📎 Attachments (${notice.attachments.length})</h4>
                <div class="attachments-list">
                    ${notice.attachments.map(attachment => `
                        <div class="attachment-item">
                            <span class="attachment-icon">📎</span>
                            <span class="attachment-name">${attachment.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';
        
        const categoryName = notice.category === 'urgent' ? '🚨 Urgent' : 
                            notice.category === 'academic' ? '📚 Academic' : '📋 General';
        
        const date = notice.createdAt ? new Date(notice.createdAt.seconds ? notice.createdAt.seconds * 1000 : notice.createdAt).toLocaleDateString() : '';
        
        noticeItem.innerHTML = `
            <div class="notice-admin-header">
                <div class="notice-admin-info">
                    <h3>${notice.title}</h3>
                    <p>${categoryName} • ${date}</p>
                </div>
                <div class="notice-admin-actions">
                    <button class="edit-btn" data-notice-id="${notice.id}">Edit</button>
                    <button class="delete-btn" data-notice-id="${notice.id}">Delete</button>
                </div>
            </div>
            <div class="notice-admin-content">${notice.content}</div>
            ${attachmentsHtml}
        `;
        
        // Add event listeners
        const editBtn = noticeItem.querySelector('.edit-btn');
        const deleteBtn = noticeItem.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => editNotice(notice.id));
        deleteBtn.addEventListener('click', () => deleteNotice(notice.id));
        
        noticesList.appendChild(noticeItem);
    });
}

// Notice management functions
addNoticeBtn.addEventListener('click', () => {
    currentEditingNotice = null;
    noticeModalTitle.textContent = 'Add New Notice';
    noticeForm.reset();
    clearAttachmentsList();
    noticeModal.style.display = 'flex';
});

function editNotice(noticeId) {
    const notice = noticesArray.find(n => n.id === noticeId);
    if (!notice) return;
    
    currentEditingNotice = noticeId;
    noticeModalTitle.textContent = 'Edit Notice';
    
    document.getElementById('noticeTitle').value = notice.title || '';
    document.getElementById('noticeCategory').value = notice.category || '';
    document.getElementById('noticeContent').value = notice.content || '';
    
    // Load attachments
    clearAttachmentsList();
    if (notice.attachments && notice.attachments.length > 0) {
        notice.attachments.forEach(attachment => {
            addAttachmentInput(attachment.name, attachment.url);
        });
    }
    
    noticeModal.style.display = 'flex';
}

async function deleteNotice(noticeId) {
    if (!confirm('Are you sure you want to delete this notice?')) {
        return;
    }
    
    try {
        await db.collection('notices').doc(noticeId).delete();
        await loadNotices(); // Reload to update the display
    } catch (err) {
        console.error('Error deleting notice:', err);
        alert('Error deleting notice. Please try again.');
    }
}

function clearAttachmentsList() {
    attachmentsList.innerHTML = '';
}

function addAttachmentInput(name = '', url = '') {
    const attachmentDiv = document.createElement('div');
    attachmentDiv.className = 'attachment-input-group';
    
    attachmentDiv.innerHTML = `
        <input type="text" placeholder="File name (e.g., document.pdf)" value="${name}" class="attachment-name-input" required>
        <input type="url" placeholder="File URL (Google Drive link)" value="${url}" class="attachment-url-input" required>
        <button type="button" class="remove-attachment-btn">Remove</button>
    `;
    
    const removeBtn = attachmentDiv.querySelector('.remove-attachment-btn');
    removeBtn.addEventListener('click', () => {
        attachmentDiv.remove();
    });
    
    attachmentsList.appendChild(attachmentDiv);
}

// Add attachment button handler
addAttachmentBtn.addEventListener('click', () => {
    addAttachmentInput();
});

// Notice form submission
noticeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('noticeTitle').value.trim();
    const category = document.getElementById('noticeCategory').value;
    const content = document.getElementById('noticeContent').value.trim();
    
    if (!title || !category || !content) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Collect attachments
    const attachments = [];
    const attachmentInputs = attachmentsList.querySelectorAll('.attachment-input-group');
    attachmentInputs.forEach(inputGroup => {
        const nameInput = inputGroup.querySelector('.attachment-name-input');
        const urlInput = inputGroup.querySelector('.attachment-url-input');
        
        if (nameInput.value.trim() && urlInput.value.trim()) {
            attachments.push({
                name: nameInput.value.trim(),
                url: urlInput.value.trim()
            });
        }
    });
    
    const noticeData = {
        title,
        category,
        content,
        attachments,
        createdAt: new Date()
    };
    
    try {
        if (currentEditingNotice) {
            // Update existing notice
            await db.collection('notices').doc(currentEditingNotice).update(noticeData);
        } else {
            // Add new notice
            await db.collection('notices').add(noticeData);
        }
        
        noticeModal.style.display = 'none';
        await loadNotices();
    } catch (err) {
        console.error('Error saving notice:', err);
        alert('Error saving notice. Please try again.');
    }
});

// Course management functions
addCourseBtn.addEventListener('click', () => {
    currentEditingCourse = null;
    courseModalTitle.textContent = 'Add New Course';
    courseForm.reset();
    courseModal.style.display = 'flex';
});

function editCourse(courseId) {
    const course = coursesArray.find(c => c.id === courseId);
    if (!course) return;
    
    currentEditingCourse = courseId;
    courseModalTitle.textContent = 'Edit Course';
    
    document.getElementById('courseCode').value = course.code || '';
    document.getElementById('courseTitle').value = course.title || '';
    document.getElementById('courseInstructor').value = course.instructor || '';
    
    courseModal.style.display = 'flex';
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This will also delete all associated notes.')) {
        return;
    }
    
    try {
        // Delete all notes for this course first
        const notesSnapshot = await db.collection('courses').doc(courseId).collection('notes').get();
        const deletePromises = notesSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        const slidesSnapshot = await db.collection('courses').doc(courseId).collection('slides').get();
        const deleteSlidesPromises = slidesSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteSlidesPromises);

        const studentNotesSnapshot = await db.collection('courses').doc(courseId).collection('student-notes').get();
        const deleteStudentNotesPromises = studentNotesSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteStudentNotesPromises);
        
        // Delete the course
        await db.collection('courses').doc(courseId).delete();
        
        // Reload courses
        await loadCourses();
    } catch (err) {
        console.error('Error deleting course:', err);
        alert('Error deleting course. Please try again.');
    }
}

// Note management functions
addNoteBtn.addEventListener('click', () => {
    if (coursesArray.length === 0) {
        alert('Please add a course first before adding resources.');
        return;
    }
    
    currentEditingNote = null;
    noteModalTitle.textContent = 'Add New Note';
    noteForm.reset();
    noteTypeSelect.value = 'notes';
    noteModal.style.display = 'flex';
});

addSlideBtn.addEventListener('click', () => {
    if (coursesArray.length === 0) {
        alert('Please add a course first before adding resources.');
        return;
    }
    
    currentEditingNote = null;
    noteModalTitle.textContent = 'Add New Lecture Slide';
    noteForm.reset();
    noteTypeSelect.value = 'slides';
    noteModal.style.display = 'flex';
});

addStudentNoteBtn.addEventListener('click', () => {
    if (coursesArray.length === 0) {
        alert('Please add a course first before adding resources.');
        return;
    }
    
    currentEditingNote = null;
    noteModalTitle.textContent = 'Add New Student Note';
    noteForm.reset();
    noteTypeSelect.value = 'student-notes';
    noteModal.style.display = 'flex';
});

async function editNote(courseId, noteId, resourceType) {
    try {
        const noteDoc = await db.collection('courses').doc(courseId).collection(resourceType).doc(noteId).get();
        if (!noteDoc.exists) return;
        
        const note = noteDoc.data();
        currentEditingNote = { courseId, noteId, resourceType };
        
        const resourceTypeName = resourceType === 'notes' ? 'Note' : 
                                resourceType === 'slides' ? 'Lecture Slide' : 'Student Note';
        noteModalTitle.textContent = `Edit ${resourceTypeName}`;
        
        document.getElementById('noteCourse').value = courseId;
        document.getElementById('noteType').value = resourceType;
        document.getElementById('noteSection').value = note.section || '';
        document.getElementById('noteTitle').value = note.title || '';
        document.getElementById('noteDescription').value = note.description || '';
        document.getElementById('noteLink').value = note.fileUrl || note.linkUrl || '';
        
        noteModal.style.display = 'flex';
    } catch (err) {
        console.error('Error loading resource for editing:', err);
        alert('Error loading resource. Please try again.');
    }
}

async function deleteNote(courseId, noteId, resourceType) {
    const resourceTypeName = resourceType === 'notes' ? 'note' : 
                            resourceType === 'slides' ? 'lecture slide' : 'student note';
    
    if (!confirm(`Are you sure you want to delete this ${resourceTypeName}?`)) {
        return;
    }
    
    try {
        await db.collection('courses').doc(courseId).collection(resourceType).doc(noteId).delete();
        await loadCourses(); // Reload to update the display
    } catch (err) {
        console.error('Error deleting resource:', err);
        alert('Error deleting resource. Please try again.');
    }
}

// Course form submission
courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const courseData = {
        code: document.getElementById('courseCode').value.trim(),
        title: document.getElementById('courseTitle').value.trim(),
        instructor: document.getElementById('courseInstructor').value.trim(),
        createdAt: new Date()
    };
    
    try {
        if (currentEditingCourse) {
            // Update existing course
            await db.collection('courses').doc(currentEditingCourse).update(courseData);
        } else {
            // Add new course
            await db.collection('courses').add(courseData);
        }
        
        courseModal.style.display = 'none';
        await loadCourses();
    } catch (err) {
        console.error('Error saving course:', err);
        alert('Error saving course. Please try again.');
    }
});

// Note form submission
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const noteData = {
        title: document.getElementById('noteTitle').value.trim(),
        description: document.getElementById('noteDescription').value.trim(),
        fileUrl: document.getElementById('noteLink').value.trim(),
        section: document.getElementById('noteSection').value,
        createdAt: new Date()
    };
    
    const courseId = document.getElementById('noteCourse').value;
    if (!courseId) {
        alert('Please select a course.');
        return;
    }

    const resourceType = document.getElementById('noteType').value;
    if (!resourceType) {
        alert('Please select a resource type.');
        return;
    }
    
    const section = document.getElementById('noteSection').value;
    if (!section) {
        alert('Please select a section.');
        return;
    }
    
    try {
        if (currentEditingNote) {
            // Update existing note
            await db.collection('courses').doc(currentEditingNote.courseId).collection(currentEditingNote.resourceType).doc(currentEditingNote.noteId).update(noteData);
        } else {
            // Add new note
            await db.collection('courses').doc(courseId).collection(resourceType).add(noteData);
        }
        
        noteModal.style.display = 'none';
        await loadCourses();
    } catch (err) {
        console.error('Error saving note:', err);
        alert('Error saving note. Please try again.');
    }
});

// Modal close handlers
closeCourseModal.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

closeNoteModal.addEventListener('click', () => {
    noteModal.style.display = 'none';
});

closeNoticeModal.addEventListener('click', () => {
    noticeModal.style.display = 'none';
});

cancelCourse.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

cancelNote.addEventListener('click', () => {
    noteModal.style.display = 'none';
});

cancelNotice.addEventListener('click', () => {
    noticeModal.style.display = 'none';
});

// Close modals when clicking outside
courseModal.addEventListener('click', (e) => {
    if (e.target === courseModal) {
        courseModal.style.display = 'none';
    }
});

noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) {
        noteModal.style.display = 'none';
    }
});

noticeModal.addEventListener('click', (e) => {
    if (e.target === noticeModal) {
        noticeModal.style.display = 'none';
    }
});

// Load extra classes in admin panel
async function loadExtraClasses() {
    try {
        // Delete expired extra classes first
        await deleteExpiredItems();
        
        const snapshot = await db.collection('extraClasses').orderBy('date', 'asc').get();
        extraClassesArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderExtraClassesList();
    } catch (err) {
        console.error('Error loading extra classes:', err);
        extraClassesArray = [];
        renderExtraClassesList();
    }
}

// Render extra classes list in admin panel
function renderExtraClassesList() {
    extraClassesList.innerHTML = '';
    
    if (!extraClassesArray.length) {
        extraClassesList.innerHTML = '<div class="no-extra-classes-message">No extra classes available yet.</div>';
        return;
    }
    
    extraClassesArray.forEach(extraClass => {
        const extraClassItem = document.createElement('div');
        extraClassItem.className = 'extra-class-admin-item';
        
        const date = extraClass.date ? new Date(extraClass.date.seconds ? extraClass.date.seconds * 1000 : extraClass.date).toLocaleDateString() : '';
        const dayName = extraClass.day ? extraClass.day.charAt(0).toUpperCase() + extraClass.day.slice(1) : 'TBA';
        const subsection = extraClass.subsection ? ` | Sub: ${extraClass.subsection}` : '';
        
        extraClassItem.innerHTML = `
            <div class="extra-class-admin-header">
                <div class="extra-class-admin-info">
                    <h3>${extraClass.title || 'Extra Class'}</h3>
                    <p>📅 ${date} | 📆 ${dayName} | ⏰ ${extraClass.time || 'TBA'} | 📍 ${extraClass.room || 'TBA'}</p>
                </div>
                <div class="extra-class-admin-actions">
                    <button class="edit-btn" data-extra-class-id="${extraClass.id}">Edit</button>
                    <button class="delete-btn" data-extra-class-id="${extraClass.id}">Delete</button>
                </div>
            </div>
            <div class="extra-class-admin-content">
                <strong>Subject:</strong> ${extraClass.subject || 'N/A'}${subsection} | <strong>Instructor:</strong> ${extraClass.instructor || 'N/A'}<br>
                <strong>Description:</strong> ${extraClass.description || 'No description provided.'}
            </div>
        `;
        
        // Add event listeners
        const editBtn = extraClassItem.querySelector('.edit-btn');
        const deleteBtn = extraClassItem.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => editExtraClass(extraClass.id));
        deleteBtn.addEventListener('click', () => deleteExtraClass(extraClass.id));
        
        extraClassesList.appendChild(extraClassItem);
    });
}

// Extra class management functions
addExtraClassBtn.addEventListener('click', () => {
    currentEditingExtraClass = null;
    extraClassModalTitle.textContent = 'Add New Extra Class';
    extraClassForm.reset();
    extraClassModal.style.display = 'flex';
});

function editExtraClass(extraClassId) {
    const extraClass = extraClassesArray.find(ec => ec.id === extraClassId);
    if (!extraClass) return;
    
    currentEditingExtraClass = extraClassId;
    extraClassModalTitle.textContent = 'Edit Extra Class';
    
    document.getElementById('extraClassTitle').value = extraClass.title || '';
    document.getElementById('extraClassSubject').value = extraClass.subject || '';
    document.getElementById('extraClassSubsection').value = extraClass.subsection || '';
    document.getElementById('extraClassDate').value = extraClass.date ? new Date(extraClass.date.seconds ? extraClass.date.seconds * 1000 : extraClass.date).toISOString().slice(0, 10) : '';
    document.getElementById('extraClassDay').value = extraClass.day || '';
    document.getElementById('extraClassTime').value = extraClass.time || '';
    document.getElementById('extraClassRoom').value = extraClass.room || '';
    document.getElementById('extraClassInstructor').value = extraClass.instructor || '';
    document.getElementById('extraClassDescription').value = extraClass.description || '';
    
    extraClassModal.style.display = 'flex';
}

async function deleteExtraClass(extraClassId) {
    if (!confirm('Are you sure you want to delete this extra class?')) {
        return;
    }
    
    try {
        await db.collection('extraClasses').doc(extraClassId).delete();
        await loadExtraClasses(); // Reload to update the display
    } catch (err) {
        console.error('Error deleting extra class:', err);
        alert('Error deleting extra class. Please try again.');
    }
}

// Extra class form submission
extraClassForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const extraClassData = {
        title: document.getElementById('extraClassTitle').value.trim(),
        subject: document.getElementById('extraClassSubject').value.trim(),
        subsection: document.getElementById('extraClassSubsection').value.trim(),
        date: document.getElementById('extraClassDate').value,
        day: document.getElementById('extraClassDay').value,
        time: document.getElementById('extraClassTime').value,
        room: document.getElementById('extraClassRoom').value.trim(),
        instructor: document.getElementById('extraClassInstructor').value.trim(),
        description: document.getElementById('extraClassDescription').value.trim(),
        createdAt: new Date()
    };
    
    try {
        if (currentEditingExtraClass) {
            // Update existing extra class
            await db.collection('extraClasses').doc(currentEditingExtraClass).update(extraClassData);
        } else {
            // Add new extra class
            await db.collection('extraClasses').add(extraClassData);
        }
        
        extraClassModal.style.display = 'none';
        await loadExtraClasses();
    } catch (err) {
        console.error('Error saving extra class:', err);
        alert('Error saving extra class. Please try again.');
    }
});

// Modal close handlers for extra classes
closeExtraClassModal.addEventListener('click', () => {
    extraClassModal.style.display = 'none';
});

cancelExtraClass.addEventListener('click', () => {
    extraClassModal.style.display = 'none';
});

extraClassModal.addEventListener('click', (e) => {
    if (e.target === extraClassModal) {
        extraClassModal.style.display = 'none';
    }
});

// Auto-delete expired items
async function deleteExpiredItems() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
  
  try {
    // Delete expired events
    const eventsSnapshot = await db.collection('events').get();
    const expiredEvents = eventsSnapshot.docs.filter(doc => {
      const eventData = doc.data();
      if (!eventData.date) return false;
      
      const eventDate = new Date(eventData.date.seconds ? eventData.date.seconds * 1000 : eventData.date);
      eventDate.setHours(0, 0, 0, 0);
      
      return eventDate < today;
    });
    
    for (const doc of expiredEvents) {
      await doc.ref.delete();
      console.log(`Admin: Deleted expired event: ${doc.data().title}`);
    }
    
    // Delete expired extra classes
    const extraClassesSnapshot = await db.collection('extraClasses').get();
    const expiredExtraClasses = extraClassesSnapshot.docs.filter(doc => {
      const extraClassData = doc.data();
      if (!extraClassData.date) return false;
      
      const extraClassDate = new Date(extraClassData.date.seconds ? extraClassData.date.seconds * 1000 : extraClassData.date);
      extraClassDate.setHours(0, 0, 0, 0);
      
      return extraClassDate < today;
    });
    
    for (const doc of expiredExtraClasses) {
      await doc.ref.delete();
      console.log(`Admin: Deleted expired extra class: ${doc.data().title}`);
    }
    
    if (expiredEvents.length > 0 || expiredExtraClasses.length > 0) {
      console.log(`Admin: Auto-deleted ${expiredEvents.length} expired events and ${expiredExtraClasses.length} expired extra classes`);
    }
  } catch (error) {
    console.error('Error deleting expired items:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing admin panel...');
        await loadEventsFromFirebase();
        await loadNotices();
        await loadExtraClasses();
        console.log('Admin panel initialized successfully');
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        alert('Error initializing admin panel. Please refresh the page.');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && eventModal.style.display === 'flex') {
        closeEventModalFunc();
    }
});
