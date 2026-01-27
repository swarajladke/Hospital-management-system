import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import iCalendarPlugin from '@fullcalendar/icalendar';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Loader2, Info } from 'lucide-react';

export default function CalendarPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            setLoading(false);
        }
    }, [authLoading]);

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
            </div>
        );
    }

    const icalUrl = `${window.location.protocol}//${window.location.hostname}:8000/api/integrations/calendar/feed/${user?.profile?.ical_token}/`;

    return (
        <div className="animate-in max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-primary-400" />
                        Appointment Calendar
                    </h1>
                    <p className="text-primary-300 mt-1">View and manage your schedule in a unified view</p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-primary-900/50 text-primary-200 rounded-lg text-sm border border-primary-800">
                    <Info className="w-4 h-4 flex-shrink-0 text-primary-400" />
                    <span>This view is synced via your personal iCal feed.</span>
                </div>
            </div>

            {/* Calendar Card */}
            <div className="card-dark overflow-hidden shadow-2xl border border-primary-800 bg-primary-900/40 backdrop-blur-sm rounded-2xl overflow-x-auto">
                <div className="p-4 md:p-6 min-w-[800px]">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, iCalendarPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={{
                            url: icalUrl,
                            format: 'ics'
                        }}
                        eventClick={(info) => {
                            alert(`Event: ${info.event.title}\nDescription: ${info.event.extendedProps.description || 'No additional details'}`);
                        }}
                        height="auto"
                        nowIndicator={true}
                        editable={false}
                        selectable={true}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            meridiem: 'short'
                        }}
                        themeSystem="standard"
                        eventBackgroundColor="#6366f1"
                        eventBorderColor="#4f46e5"
                        eventClassNames="rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer hover:brightness-110 transition-all shadow-md"
                    />
                </div>
            </div>

            {/* Legend/Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary-900/30 rounded-lg border border-primary-800/50">
                    <h3 className="font-semibold text-white mb-2">Instructions</h3>
                    <ul className="text-sm text-primary-300 space-y-1 list-disc list-inside">
                        <li>Click on an appointment to see details</li>
                        <li>Switch between Month, Week, and Day views using the buttons at the top right</li>
                        <li>Appointments are automatically color-coded</li>
                    </ul>
                </div>
                <div className="p-4 bg-primary-900/30 rounded-lg border border-primary-800/50">
                    <h3 className="font-semibold text-white mb-2">Sync Status</h3>
                    <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Connected to Local Feed
                    </div>
                    <p className="text-xs text-primary-400 mt-2">
                        Feed Token: <span className="font-mono text-primary-300">{user?.profile?.ical_token?.substring(0, 8)}...</span>
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                /* Main Calendar Text */
                .fc { color: #e2e8f0 !important; }
                .fc-toolbar-title { color: #f8fafc !important; font-weight: 700 !important; }
                
                /* Buttons */
                .fc .fc-button-primary {
                    background-color: #312e81 !important;
                    border-color: #4338ca !important;
                    color: #e2e8f0 !important;
                    text-transform: capitalize !important;
                }
                .fc .fc-button-primary:hover {
                    background-color: #4338ca !important;
                }
                .fc .fc-button-primary:not(:disabled).fc-button-active, 
                .fc .fc-button-primary:not(:disabled):active {
                    background-color: #4f46e5 !important;
                    border-color: #4f46e5 !important;
                }
                
                /* Grid & Borders */
                .fc-theme-standard td, .fc-theme-standard th {
                    border-color: #1e293b !important;
                }
                .fc-scrollgrid {
                    border-color: #1e293b !important;
                }
                
                /* Header Cells */
                .fc-col-header-cell {
                    background-color: #0f172a !important;
                    padding: 12px 0 !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    font-size: 0.75rem !important;
                    color: #94a3b8 !important;
                }
                
                /* Day Cells */
                .fc-day-today {
                    background-color: rgba(79, 70, 229, 0.1) !important;
                }
                .fc-day-other {
                    background-color: rgba(15, 23, 42, 0.3) !important;
                }
                .fc-daygrid-day-number {
                    color: #94a3b8 !important;
                    padding: 8px !important;
                    font-weight: 500 !important;
                }
                .fc-daygrid-day:hover {
                    background-color: rgba(255, 255, 255, 0.02) !important;
                }
                
                /* Events */
                .fc-event-title {
                    white-space: normal !important;
                    padding: 1px 0 !important;
                }
                .fc-daygrid-event {
                    margin-top: 2px !important;
                }
            ` }} />
        </div>
    );
}
