import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TimelineModule } from 'primeng/timeline';
import { LayoutService } from '../../layout/service/layout.service';

interface StudySession {
    subject: string;
    time: string;
    duration: string;
    status: 'completed' | 'upcoming' | 'in-progress';
    icon: string;
}

interface Deadline {
    task: string;
    subject: string;
    dueDate: Date;
    completed: boolean;
}

interface StudyGoal {
    studied: number;  // in minutes
    target: number;   // in minutes
}

interface MotivationalQuote {
    text: string;
    author: string;
}

@Component({
    selector: 'app-dashboard1',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ChartModule,
        CardModule,
        TableModule,
        TagModule,
        ButtonModule,
        InputGroupModule,
        InputTextModule,
        ProgressBarModule,
        TimelineModule
    ],
    template: `
        <div class="grid grid-cols-12 gap-6">
            <!-- Greeting Card -->
            <div class="col-span-12 lg:col-span-6">
                <p-card styleClass="h-full">
                    <!-- Header with greeting -->
                    <div class="mb-4">
                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0">
                            {{ getGreeting() }}, Sarah!
                        </h2>
                        <div class="flex items-center mt-1">
                            <i class="pi pi-calendar text-muted-color text-sm mr-2"></i>
                            <p class="text-muted-color text-sm mb-0">{{ getCurrentDate() }}</p>
                        </div>
                    </div>

                    <!-- Motivational Quote -->
                    <div [class]="'p-4 rounded-lg border-l-4 mb-4 bg-' + layoutService.getPrimary() + '-50 dark:bg-' + layoutService.getPrimary() + '-400/10 border-' + layoutService.getPrimary() + '-500'">
                        <div class="flex items-start">
                            <i [class]="'pi pi-quote-right text-lg mr-3 mt-1 text-' + layoutService.getPrimary() + '-500'"></i>
                            <div>
                                <p class="text-surface-700 dark:text-surface-200 italic mb-2 leading-relaxed">
                                    "{{ getCurrentQuote().text }}"
                                </p>
                                <span class="text-xs text-muted-color">— {{ getCurrentQuote().author }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Study Timer/Goal -->
                    <div [class]="'p-4 rounded-lg border mb-4 bg-' + layoutService.getPrimary() + '-50 dark:bg-' + layoutService.getPrimary() + '-400/10 border-' + layoutService.getPrimary() + '-200 dark:border-' + layoutService.getPrimary() + '-700'">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center">
                                <i [class]="'pi pi-clock text-lg mr-2 text-' + layoutService.getPrimary() + '-600'"></i>
                                <span class="font-medium text-surface-900 dark:text-surface-0">Study Timer</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <p-button icon="pi pi-minus" [text]="true" size="small" 
                                          (click)="adjustStudyGoal(-15)" [disabled]="studyGoal.target <= 15" />
                                <span [class]="'text-sm font-bold min-w-16 text-center text-' + layoutService.getPrimary() + '-600'">
                                    {{ formatStudyTime(studyGoal.target) }}
                                </span>
                                <p-button icon="pi pi-plus" [text]="true" size="small" 
                                          (click)="adjustStudyGoal(15)" [disabled]="studyGoal.target >= 480" />
                            </div>
                        </div>
                        
                        <!-- Circular Progress -->
                        <div class="flex items-center justify-center mb-3">
                            <div class="relative w-32 h-32">
                                <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                    <!-- Background circle -->
                                    <circle cx="50" cy="50" r="45" stroke="currentColor" 
                                            [class]="'text-' + layoutService.getPrimary() + '-200 dark:text-' + layoutService.getPrimary() + '-800'" stroke-width="8" fill="none"/>
                                    <!-- Progress circle -->
                                    <circle cx="50" cy="50" r="45" stroke="currentColor" 
                                            [class]="'text-' + layoutService.getPrimary() + '-500'" stroke-width="8" fill="none"
                                            [style.stroke-dasharray]="283"
                                            [style.stroke-dashoffset]="283 - (283 * getStudyProgress() / 100)"
                                            style="transition: stroke-dashoffset 0.3s ease"/>
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="text-center">
                                        <div [class]="'text-lg font-bold text-' + layoutService.getPrimary() + '-600'">{{ formatStudyTime(studyGoal.studied) }}</div>
                                        <div class="text-xs text-muted-color">studied</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-between items-center">
                            <span class="text-xs text-muted-color">{{ getStudyProgress() }}% complete</span>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-play" size="small" severity="success" 
                                          *ngIf="!isStudyTimerRunning" (click)="startStudyTimer()" />
                                <p-button icon="pi pi-pause" size="small" severity="warn" 
                                          *ngIf="isStudyTimerRunning" (click)="pauseStudyTimer()" />
                                <p-button icon="pi pi-refresh" size="small" severity="secondary" 
                                          (click)="resetStudyTimer()" />
                            </div>
                        </div>
                        
                        <div class="text-center mt-2" *ngIf="studyGoal.studied >= studyGoal.target">
                            <span class="text-green-600 font-medium text-sm">
                                🎉 Goal achieved! Great work!
                            </span>
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="grid grid-cols-3 gap-4">
                        <div [class]="'text-center p-3 rounded-lg bg-' + layoutService.getPrimary() + '-50 dark:bg-' + layoutService.getPrimary() + '-400/10'">
                            <div [class]="'flex items-center justify-center text-lg font-bold mb-1 text-' + layoutService.getPrimary() + '-500'">
                                <i class="pi pi-fire mr-1"></i>
                                <span>{{ studyStreak }}</span>
                            </div>
                            <div class="text-xs text-muted-color">Day Streak</div>
                        </div>
                        <div [class]="'text-center p-3 rounded-lg bg-' + layoutService.getPrimary() + '-50 dark:bg-' + layoutService.getPrimary() + '-400/10'">
                            <div [class]="'text-lg font-bold text-' + layoutService.getPrimary() + '-600'">{{ todayStats.tasksCompleted }}</div>
                            <div class="text-xs text-muted-color">Tasks Done</div>
                        </div>
                        <div [class]="'text-center p-3 rounded-lg bg-' + layoutService.getPrimary() + '-50 dark:bg-' + layoutService.getPrimary() + '-400/10'">
                            <div [class]="'text-lg font-bold text-' + layoutService.getPrimary() + '-600'">{{ todayStats.notesCreated }}</div>
                            <div class="text-xs text-muted-color">Notes Created</div>
                        </div>
                    </div>
                </p-card>
            </div>

            <!-- Upcoming Deadlines -->
            <div class="col-span-12 lg:col-span-6">
                <p-card styleClass="h-full">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <h3 class="text-lg font-semibold m-0">Upcoming Deadlines</h3>
                        </div>
                        <p-button label="Add Task" icon="pi pi-plus" size="small" [text]="true" />
                    </div>
                    <div class="space-y-3">
                        <div *ngFor="let deadline of deadlines.slice(0, 4)" 
                             class="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-surface-700"
                             [ngClass]="{'opacity-60': deadline.completed}">
                            <div class="flex items-center">
                                <i [class]="'pi pi-file text-lg mr-3 text-' + layoutService.getPrimary() + '-500'"></i>
                                <div>
                                    <div class="font-medium text-surface-900 dark:text-surface-0" 
                                         [ngClass]="{'line-through': deadline.completed}">
                                        {{ deadline.task }}
                                    </div>
                                    <div class="text-xs text-muted-color">{{ deadline.subject }}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm text-surface-700 dark:text-surface-300 mb-1">
                                    {{ formatDeadlineDate(deadline.dueDate) }} at {{ formatDeadlineTime(deadline.dueDate) }}
                                </div>
                                <div class="text-xs font-medium" [ngClass]="getDeadlineUrgency(deadline.dueDate)">
                                    {{ getTimeRemaining(deadline.dueDate) }} remaining
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 text-center" *ngIf="deadlines.length > 4">
                        <p-button label="View All ({{ deadlines.length }})" [text]="true" size="small" />
                    </div>
                </p-card>
            </div>

            <!-- Study Planner Timeline -->
            <div class="col-span-12 lg:col-span-6">
                <p-card styleClass="h-full">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <i [class]="'pi pi-calendar text-xl mr-3 text-' + layoutService.getPrimary() + '-500'"></i>
                            <h3 class="text-lg font-semibold m-0">Today's Study Plan</h3>
                        </div>
                        <p-button label="Add Session" icon="pi pi-plus" size="small" [text]="true" />
                    </div>
                    <div class="space-y-3">
                        <div *ngFor="let session of studySessions" 
                             class="flex items-center p-3 rounded-lg border border-surface-200 dark:border-surface-700"
                             [ngClass]="{
                                'bg-green-50 dark:bg-green-400/10': session.status === 'completed',
                                'bg-blue-50 dark:bg-blue-400/10': session.status === 'in-progress',
                                'bg-surface-50 dark:bg-surface-800': session.status === 'upcoming'
                             }">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full mr-3"
                                 [ngClass]="{
                                    'bg-green-500': session.status === 'completed',
                                    'bg-blue-500': session.status === 'in-progress',
                                    'bg-surface-400': session.status === 'upcoming'
                                 }">
                                <i [class]="session.icon" class="text-white text-sm"></i>
                            </div>
                            <div class="flex-grow">
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ session.subject }}</div>
                                <div class="text-sm text-muted-color">{{ session.time }} • {{ session.duration }}</div>
                            </div>
                            <div>
                                <i *ngIf="session.status === 'completed'" class="pi pi-check text-green-500"></i>
                                <i *ngIf="session.status === 'in-progress'" [class]="'pi pi-clock text-' + layoutService.getPrimary() + '-500'"></i>
                            </div>
                        </div>
                    </div>
                </p-card>
            </div>

            <!-- Quick Actions -->
            <div class="col-span-12 lg:col-span-6">
                <p-card styleClass="h-full">
                    <div class="flex items-center mb-4">
                        <h3 class="text-lg font-semibold m-0">Quick Actions</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <p-button label="Add Note" icon="pi pi-file-plus" [outlined]="true" 
                                  styleClass="w-full flex-col h-20 text-sm" />
                        <p-button label="Upload Lecture" icon="pi pi-upload" [outlined]="true" 
                                  styleClass="w-full flex-col h-20 text-sm" />
                        <p-button label="Start Quiz" icon="pi pi-play" [outlined]="true" 
                                  styleClass="w-full flex-col h-20 text-sm" />
                        <p-button label="Set Timer" icon="pi pi-clock" [outlined]="true" 
                                  styleClass="w-full flex-col h-20 text-sm" />
                        <p-button label="Review Cards" icon="pi pi-bookmark" [outlined]="true" 
                                  styleClass="w-full flex-col h-20 text-sm" />
                        <p-button label="Create Flashcard" icon="pi pi-plus-circle" [outlined]="true" 
                                  styleClass="w-full flex-col h-20 text-sm" />
                    </div>
                </p-card>
            </div>

            <!-- Weekly Performance Chart -->
            <div class="col-span-12">
                <p-card>
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <i [class]="'pi pi-chart-line text-xl mr-3 text-' + layoutService.getPrimary() + '-500'"></i>
                            <h3 class="text-lg font-semibold m-0">Weekly Performance</h3>
                        </div>
                        <div class="flex gap-2">
                            <p-button label="Study Hours" [text]="true" size="small" />
                            <p-button label="Tasks" [text]="true" size="small" />
                        </div>
                    </div>
                    <p-chart type="line" [data]="performanceData" [options]="performanceOptions" class="h-80" />
                </p-card>
            </div>
        </div>
    `
})
export class Dashboard1 implements OnInit, OnDestroy {
    studyStreak = 4;
    isStudyTimerRunning = false;
    private studyTimerInterval: any;
    
    studyGoal: StudyGoal = {
        studied: 150,    // 2.5 hours in minutes
        target: 180      // 3 hours in minutes
    };

    motivationalQuotes: MotivationalQuote[] = [
        { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
        { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
        { text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
        { text: "The only way to learn mathematics is to do mathematics.", author: "Paul Halmos" },
        { text: "Tell me and I forget, teach me and I may remember, involve me and I learn.", author: "Benjamin Franklin" }
    ];

    todayStats = {
        studyHours: 2.5,
        flashcardsReviewed: 45,
        tasksCompleted: 8,
        notesCreated: 3
    };

    performanceData: any;
    performanceOptions: any;

    studySessions: StudySession[] = [
        {
            subject: 'Calculus - Integration',
            time: '9:00 AM',
            duration: '90 min',
            status: 'completed',
            icon: 'pi pi-check'
        },
        {
            subject: 'Biology - Cell Structure',
            time: '11:00 AM',
            duration: '60 min',
            status: 'in-progress',
            icon: 'pi pi-play'
        },
        {
            subject: 'Chemistry - Organic Compounds',
            time: '2:00 PM',
            duration: '45 min',
            status: 'upcoming',
            icon: 'pi pi-clock'
        },
        {
            subject: 'Physics - Quantum Mechanics',
            time: '4:00 PM',
            duration: '75 min',
            status: 'upcoming',
            icon: 'pi pi-clock'
        }
    ];

    deadlines: Deadline[] = [
        {
            task: 'Chemistry Lab Report',
            subject: 'CHEM 201',
            dueDate: new Date('2025-08-04T23:59:00'), // Tomorrow at 11:59 PM
            completed: false
        },
        {
            task: 'Calculus Problem Set',
            subject: 'MATH 101',
            dueDate: new Date('2025-08-08T15:30:00'), // Friday at 3:30 PM
            completed: false
        },
        {
            task: 'Biology Essay',
            subject: 'BIO 150',
            dueDate: new Date('2025-08-12T09:00:00'), // Next Tuesday at 9:00 AM
            completed: true
        },
        {
            task: 'Physics Quiz Prep',
            subject: 'PHYS 102',
            dueDate: new Date('2025-08-04T14:00:00'), // Tomorrow at 2:00 PM
            completed: false
        }
    ];

    constructor(public layoutService: LayoutService) {}

    ngOnInit() {
        this.initCharts();
        
        // Re-initialize charts when the layout config changes
        this.layoutService.configUpdate$.subscribe(() => {
            setTimeout(() => {
                this.initCharts();
            }, 100);
        });
    }

    ngOnDestroy() {
        if (this.studyTimerInterval) {
            clearInterval(this.studyTimerInterval);
        }
    }

    getGreeting(): string {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }

    getCurrentDate(): string {
        return new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    getCurrentQuote(): MotivationalQuote {
        // Rotate quote based on day of year for consistency
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const quoteIndex = dayOfYear % this.motivationalQuotes.length;
        return this.motivationalQuotes[quoteIndex];
    }

    getStudyProgress(): number {
        return Math.min(Math.round((this.studyGoal.studied / this.studyGoal.target) * 100), 100);
    }

    formatStudyTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0 && mins > 0) {
            return `${hours}h ${mins}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${mins}m`;
        }
    }

    adjustStudyGoal(minutesToAdd: number): void {
        const newTarget = this.studyGoal.target + minutesToAdd;
        if (newTarget >= 15 && newTarget <= 480) { // Between 15 minutes and 8 hours
            this.studyGoal.target = newTarget;
        }
    }

    startStudyTimer(): void {
        this.isStudyTimerRunning = true;
        this.studyTimerInterval = setInterval(() => {
            this.studyGoal.studied += 1; // Add 1 minute every minute
            if (this.studyGoal.studied >= this.studyGoal.target) {
                this.pauseStudyTimer();
            }
        }, 60000); // Update every minute
    }

    pauseStudyTimer(): void {
        this.isStudyTimerRunning = false;
        if (this.studyTimerInterval) {
            clearInterval(this.studyTimerInterval);
        }
    }

    resetStudyTimer(): void {
        this.pauseStudyTimer();
        this.studyGoal.studied = 0;
    }

    formatDeadlineDate(date: Date): string {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const deadlineDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Tomorrow';
        } else if (diffDays === -1) {
            return 'Yesterday';
        } else if (diffDays > 0 && diffDays <= 7) {
            return date.toLocaleDateString('en-US', { weekday: 'long' });
        } else if (diffDays < 0) {
            return 'Overdue';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    formatDeadlineTime(date: Date): string {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    getTimeRemaining(date: Date): string {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        
        if (diffMs < 0) {
            return 'Overdue';
        }
        
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        const remainingHours = diffHours % 24;
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffDays > 0) {
            return `${diffDays}d ${remainingHours}h`;
        } else if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}m`;
        } else {
            return `${diffMinutes}m`;
        }
    }

    getDeadlineUrgency(date: Date): string {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffMs < 0) {
            return 'text-red-600'; // Overdue
        } else if (diffHours <= 24) {
            return 'text-red-500'; // Due within 24 hours
        } else if (diffHours <= 72) {
            return 'text-orange-500'; // Due within 3 days
        } else {
            return 'text-green-500'; // More than 3 days
        }
    }

    initCharts() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
        
        // Get primary color for dynamic theming
        const primaryColor = this.layoutService.getPrimary() || 'blue';
        const primaryColorMap: {[key: string]: string} = {
            'emerald': '#10b981',
            'blue': '#3b82f6',
            'purple': '#8b5cf6',
            'green': '#22c55e',
            'orange': '#f97316',
            'pink': '#ec4899',
            'red': '#ef4444',
            'indigo': '#6366f1',
            'teal': '#14b8a6',
            'cyan': '#06b6d4'
        };
        
        const primaryHex = primaryColorMap[primaryColor] || '#3b82f6';
        const secondaryHex = '#06b6d4'; // Keep cyan as secondary

        // Performance Line Chart
        this.performanceData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Study Hours',
                    data: [2.5, 4, 3, 5, 2, 1.5, 3.5],
                    fill: false,
                    borderColor: primaryHex,
                    backgroundColor: primaryHex,
                    tension: 0.4
                },
                {
                    label: 'Tasks Completed',
                    data: [3, 5, 2, 6, 4, 2, 4.5],
                    fill: false,
                    borderColor: secondaryHex,
                    backgroundColor: secondaryHex,
                    tension: 0.4
                }
            ]
        };

        this.performanceOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                }
            }
        };
    }
}
