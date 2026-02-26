'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Users, BookOpen, User, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

// --- Types ---
type Subject = string;
type Teacher = string;
type ClassName = string;

interface ScheduleSlot {
  subject: Subject;
  teacher: Teacher;
}

interface DaySchedule {
  [period: number]: ScheduleSlot | 'Recess' | 'Lunch' | 'Free';
}

interface ClassSchedule {
  [day: string]: DaySchedule;
}

interface FullSchedule {
  [className: string]: ClassSchedule;
}

// --- Constants ---
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 'Recess', 3, 4, 'Lunch', 5, 6] as const;

// --- Mock Data ---
const SUBJECTS: Subject[] = ['Math', 'Science', 'English', 'History', 'Art', 'PE'];
const TEACHERS: Record<Subject, Teacher[]> = {
  Math: ['Mr. Smith', 'Ms. Davis'],
  Science: ['Dr. Jones', 'Mr. Wilson'],
  English: ['Ms. Taylor', 'Mr. Brown'],
  History: ['Mrs. White', 'Mr. Green'],
  Art: ['Ms. Black'],
  PE: ['Coach Carter'],
};
const CLASSES: ClassName[] = ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'];

export default function SchedulerApp() {
  const [schedule, setSchedule] = useState<FullSchedule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSchedule = () => {
    setIsGenerating(true);
    setError(null);

    // Simulate a delay for the algorithm
    setTimeout(() => {
      try {
        const newSchedule = buildSchedule();
        setSchedule(newSchedule);
      } catch (err: any) {
        setError(err.message || 'Failed to generate schedule');
      } finally {
        setIsGenerating(false);
      }
    }, 800);
  };

  // --- Scheduling Algorithm ---
  const buildSchedule = (): FullSchedule => {
    const newSchedule: FullSchedule = {};
    
    // Initialize empty schedule
    CLASSES.forEach(cls => {
      newSchedule[cls] = {};
      DAYS.forEach(day => {
        newSchedule[cls][day] = {};
        PERIODS.forEach(period => {
          if (period === 'Recess' || period === 'Lunch') {
            newSchedule[cls][day][period as any] = period;
          } else {
            newSchedule[cls][day][period as number] = 'Free';
          }
        });
      });
    });

    // Helper to check if teacher is available
    const canAssignTeacher = (teacher: Teacher, day: string, period: number): boolean => {
      // Check double booking across all classes for this specific period
      for (const c of CLASSES) {
        const slot = newSchedule[c][day][period];
        if (typeof slot === 'object' && slot.teacher === teacher) {
          return false;
        }
      }
      return true;
    };

    // Assign subjects to classes
    CLASSES.forEach(cls => {
      DAYS.forEach(day => {
        // Shuffle subjects for variety
        const dailySubjects = [...SUBJECTS].sort(() => Math.random() - 0.5); 
        let subjectIndex = 0;

        [1, 2, 3, 4, 5, 6].forEach(period => {
          let assigned = false;
          let attempts = 0;
          
          while (!assigned && attempts < dailySubjects.length) {
            const subject = dailySubjects[(subjectIndex + attempts) % dailySubjects.length];
            const availableTeachers = TEACHERS[subject];
            
            // Find an available teacher for this subject
            for (const teacher of availableTeachers) {
              if (canAssignTeacher(teacher, day, period)) {
                newSchedule[cls][day][period] = { subject, teacher };
                assigned = true;
                break;
              }
            }
            attempts++;
          }
          
          if (assigned) {
            subjectIndex++;
          } else {
            // Fallback if no teacher is available (shouldn't happen with our mock data, but just in case)
            newSchedule[cls][day][period] = 'Free';
          }
        });
      });
    });

    return newSchedule;
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-semibold tracking-tight">School Scheduler</h1>
          </div>
          <button
            onClick={generateSchedule}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-medium text-indigo-900 mb-2">Scheduling Constraints Applied</h2>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <strong>Built-in Breaks:</strong> Recess after Period 2, Lunch after Period 4.
            </li>
            <li className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <strong>No 3 Consecutive Subjects:</strong> The schedule structure (2 periods → break → 2 periods → break → 2 periods) naturally prevents students and teachers from having 3 consecutive periods.
            </li>
            <li className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <strong>Teacher Availability:</strong> Prevents double-booking teachers across different classes.
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Schedule Display */}
        {schedule ? (
          <div className="space-y-12">
            {CLASSES.map(cls => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={cls} 
                className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden"
              >
                <div className="bg-neutral-900 px-6 py-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-neutral-400" />
                    {cls}
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                      <tr>
                        <th className="px-6 py-4 w-32">Time / Day</th>
                        {DAYS.map(day => (
                          <th key={day} className="px-6 py-4 min-w-[160px]">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {PERIODS.map((period, idx) => {
                        const isBreak = period === 'Recess' || period === 'Lunch';
                        
                        return (
                          <tr key={idx} className={isBreak ? 'bg-amber-50/50' : 'hover:bg-neutral-50/50 transition-colors'}>
                            <td className="px-6 py-4 font-medium text-neutral-900 border-r border-neutral-100">
                              {isBreak ? (
                                <span className="text-amber-700 flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  {period}
                                </span>
                              ) : (
                                `Period ${period}`
                              )}
                            </td>
                            
                            {DAYS.map(day => {
                              if (isBreak) {
                                return (
                                  <td key={`${day}-${period}`} className="px-6 py-4 text-amber-600/70 text-center font-medium italic">
                                    {period} Break
                                  </td>
                                );
                              }

                              const slot = schedule[cls][day][period as number];
                              
                              if (typeof slot !== 'object') {
                                return (
                                  <td key={`${day}-${period}`} className="px-6 py-4 text-neutral-400 italic">
                                    Free Period
                                  </td>
                                );
                              }

                              return (
                                <td key={`${day}-${period}`} className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium text-neutral-900 flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                      {slot.subject}
                                    </span>
                                    <span className="text-neutral-500 text-xs flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5" />
                                      {slot.teacher}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-200 border-dashed">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No Schedule Generated</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
              Click the &quot;Generate Schedule&quot; button above to create a new timetable with the specified constraints.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
