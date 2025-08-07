import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';

// Layout Service
import { LayoutService } from '../../layout/service/layout.service';

// Interfaces
interface Flashcard {
    id: string;
    front: string;
    back: string;
    course: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    lastReviewed?: Date;
    nextReview: Date;
    interval: number;
    easeFactor: number;
    reviewCount: number;
    streak: number;
    status: 'new' | 'learning' | 'review' | 'mastered';
    createdAt: Date;
}

interface FlashcardDeck {
    id: string;
    name: string;
    course: string;
    totalCards: number;
    newCards: number;
    color: string;
    lastStudied?: Date;
    isFavorite?: boolean;
    favoritedAt?: Date;
}

@Component({
    selector: 'app-flashcards',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ProgressBarModule,
        CheckboxModule,
        BadgeModule,
        TooltipModule,
        ConfirmDialogModule,
        DialogModule
    ],
    providers: [ConfirmationService],
    styles: [`
        .flashcard-container {
            perspective: 1000px;
            width: 100%;
            height: 450px;
        }

        .flashcard {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform-style: preserve-3d;
        }

        .flashcard.flipped {
            transform: rotateY(180deg);
        }

        .flashcard-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 1.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid;
            background: var(--surface-0);
            border-color: var(--surface-200);
            transition: all 0.3s ease;
        }

        .dark .flashcard-face {
            background: var(--surface-800);
            border-color: var(--surface-700);
        }

        .flashcard-front {
            z-index: 2;
        }

        .flashcard-front:hover {
            box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.35);
            transform: translateY(-2px);
        }

        .flashcard-back {
            transform: rotateY(180deg);
            z-index: 1;
        }

        .flashcard-back:hover {
            box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.35);
            transform: rotateY(180deg) translateY(-2px);
        }

        /* Add subtle glow effect when flipping */
        .flashcard.flipped .flashcard-back {
            box-shadow: 0 25px 50px -12px rgba(34, 197, 94, 0.2);
        }

        .dark .flashcard.flipped .flashcard-back {
            box-shadow: 0 25px 50px -12px rgba(34, 197, 94, 0.3);
        }

        /* Back to Deck Button Hover Effect */
        .back-to-deck-btn {
            opacity: 0.7;
            transition: all 0.2s ease;
        }

        .back-to-deck-btn:hover {
            opacity: 1;
            border-radius: 9999px !important;
        }

        .back-to-deck-btn ::ng-deep .p-button {
            transition: all 0.2s ease;
        }

        .back-to-deck-btn:hover ::ng-deep .p-button {
            border-radius: 9999px !important;
        }

        /* Flashcard Navigation Animations */
        .flashcard-container {
            position: relative;
            overflow: visible;
        }

        .flashcard-slide-enter {
            animation: pageFlipNext 0.3s ease-out;
        }

        .flashcard-slide-exit {
            animation: pageFlipExit 0.3s ease-out;
        }

        .flashcard-slide-enter-prev {
            animation: pageFlipPrev 0.3s ease-out;
        }

        .flashcard-slide-exit-prev {
            animation: pageFlipExitPrev 0.3s ease-out;
        }

        @keyframes pageFlipNext {
            0% {
                transform: translateX(100px) rotateY(25deg) scale(0.9);
                opacity: 0;
                z-index: 10;
            }
            30% {
                transform: translateX(-30px) rotateY(-10deg) scale(1.05);
                opacity: 0.8;
                z-index: 10;
            }
            70% {
                transform: translateX(10px) rotateY(3deg) scale(1.02);
                opacity: 0.95;
                z-index: 10;
            }
            100% {
                transform: translateX(0) rotateY(0deg) scale(1);
                opacity: 1;
                z-index: 1;
            }
        }

        @keyframes pageFlipExit {
            0% {
                transform: translateX(0) rotateY(0deg) scale(1);
                opacity: 1;
                z-index: 1;
            }
            100% {
                transform: translateX(-100px) rotateY(-25deg) scale(0.9);
                opacity: 0;
                z-index: -1;
            }
        }

        @keyframes pageFlipPrev {
            0% {
                transform: translateX(-100px) rotateY(-25deg) scale(0.9);
                opacity: 0;
                z-index: 10;
            }
            30% {
                transform: translateX(30px) rotateY(10deg) scale(1.05);
                opacity: 0.8;
                z-index: 10;
            }
            70% {
                transform: translateX(-10px) rotateY(-3deg) scale(1.02);
                opacity: 0.95;
                z-index: 10;
            }
            100% {
                transform: translateX(0) rotateY(0deg) scale(1);
                opacity: 1;
                z-index: 1;
            }
        }

        @keyframes pageFlipExitPrev {
            0% {
                transform: translateX(0) rotateY(0deg) scale(1);
                opacity: 1;
                z-index: 1;
            }
            100% {
                transform: translateX(100px) rotateY(25deg) scale(0.9);
                opacity: 0;
                z-index: -1;
            }
        }

        /* Deck Favorite Sliding Animation */
        .deck-slide-up {
            animation: favoriteSlideUp 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        .deck-slide-down {
            animation: unfavoriteSlideDown 0.4s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        .deck-favorite-enter {
            animation: deckFavoriteEnter 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        @keyframes favoriteSlideUp {
            0% {
                transform: translateY(0) scale(1);
                opacity: 1;
                z-index: 1;
            }
            50% {
                transform: translateY(-10px) scale(1.02);
                opacity: 0.95;
                z-index: 10;
                box-shadow: 0 8px 25px rgba(255, 193, 7, 0.2);
            }
            100% {
                transform: translateY(0) scale(1);
                opacity: 1;
                z-index: 1;
                box-shadow: 0 4px 15px rgba(255, 193, 7, 0.15);
            }
        }

        @keyframes unfavoriteSlideDown {
            0% {
                transform: translateY(0) scale(1);
                opacity: 1;
                z-index: 1;
                box-shadow: 0 4px 15px rgba(255, 193, 7, 0.15);
            }
            50% {
                transform: translateY(5px) scale(0.98);
                opacity: 0.9;
                z-index: 1;
            }
            100% {
                transform: translateY(0) scale(1);
                opacity: 1;
                z-index: 1;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
        }

        @keyframes deckFavoriteEnter {
            0% {
                background: transparent;
                border-color: var(--surface-200);
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
                box-shadow: 0 8px 25px rgba(255, 193, 7, 0.2);
            }
            100% {
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05));
                border-color: rgba(255, 193, 7, 0.3);
                transform: scale(1);
                box-shadow: 0 4px 15px rgba(255, 193, 7, 0.15);
            }
        }

        /* Deck transition styles */
        .deck-transition {
            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            position: relative;
        }

        .deck-favorite {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05)) !important;
            border-color: rgba(255, 193, 7, 0.3) !important;
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.15);
        }

        .dark .deck-favorite {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.08)) !important;
            border-color: rgba(255, 193, 7, 0.4) !important;
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
        }

        /* Deck reorder animation */
        .deck-list-item {
            transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }
    `],
    template: `
        <!-- Two-column layout -->
        <div class="min-h-screen bg-surface-50 dark:bg-surface-900">
            <div class="grid grid-cols-[400px,1fr] gap-0 min-h-screen" *ngIf="!reviewSession(); else reviewMode">
                
                <!-- Left Panel - Deck Selection & Controls -->
                <div class="bg-surface-0 dark:bg-surface-800 border-right border-surface-200 dark:border-surface-700 overflow-y-auto">
                    <div class="p-6">
                        <!-- Header -->
                        <div class="flex align-items-center gap-3 mb-6">
                            <div>
                                <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">Flashcard Stats</h1>
                            </div>
                        </div>

                        <!-- Stats Dashboard -->
                        <div class="mb-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                                <!-- Decks Stat -->
                                <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:scale-105">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="bg-blue-500 dark:bg-blue-600 rounded-lg p-2 shadow-sm">
                                            <i class="pi pi-folder text-white text-lg"></i>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ totalDecks() }}</div>
                                            <div class="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Decks</div>
                                        </div>
                                    </div>
                                    <div class="h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-500 dark:bg-blue-400 rounded-full w-full"></div>
                                    </div>
                                </div>

                                <!-- Total Cards Stat -->
                                <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:scale-105">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="bg-purple-500 dark:bg-purple-600 rounded-lg p-2 shadow-sm">
                                            <i class="pi pi-book text-white text-lg"></i>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-2xl font-bold text-purple-700 dark:text-purple-300">{{ totalCards() }}</div>
                                            <div class="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Total Cards</div>
                                        </div>
                                    </div>
                                    <div class="h-1 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-purple-500 dark:bg-purple-400 rounded-full w-full"></div>
                                    </div>
                                </div>

                                <!-- Mastered Stat -->
                                <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-green-200 dark:border-green-700/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:scale-105">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="bg-green-500 dark:bg-green-600 rounded-lg p-2 shadow-sm">
                                            <i class="pi pi-check-circle text-white text-lg"></i>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-2xl font-bold text-green-700 dark:text-green-300">{{ masteredCards() }}</div>
                                            <div class="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Mastered</div>
                                        </div>
                                    </div>
                                    <div class="h-1 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-green-500 dark:bg-green-400 rounded-full" [style.width.%]="(masteredCards() / totalCards()) * 100"></div>
                                    </div>
                                </div>

                                <!-- Easy Stat -->
                                <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20 border border-cyan-200 dark:border-cyan-700/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:scale-105">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="bg-cyan-500 dark:bg-cyan-600 rounded-lg p-2 shadow-sm">
                                            <i class="pi pi-thumbs-up text-white text-lg"></i>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{{ easyCards() }}</div>
                                            <div class="text-xs text-cyan-600 dark:text-cyan-400 font-medium uppercase tracking-wide">Easy</div>
                                        </div>
                                    </div>
                                    <div class="h-1 bg-cyan-200 dark:bg-cyan-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-cyan-500 dark:bg-cyan-400 rounded-full" [style.width.%]="(easyCards() / totalCards()) * 100"></div>
                                    </div>
                                </div>

                                <!-- Hard Stat -->
                                <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:scale-105">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="bg-orange-500 dark:bg-orange-600 rounded-lg p-2 shadow-sm">
                                            <i class="pi pi-exclamation-triangle text-white text-lg"></i>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-2xl font-bold text-orange-700 dark:text-orange-300">{{ hardCards() }}</div>
                                            <div class="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">Hard</div>
                                        </div>
                                    </div>
                                    <div class="h-1 bg-orange-200 dark:bg-orange-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-orange-500 dark:bg-orange-400 rounded-full" [style.width.%]="(hardCards() / totalCards()) * 100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Your Decks Title -->
                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">Your Decks</h3>

                        <!-- Add New Deck Button -->
                        <div class="mb-4">
                            <p-button 
                                label="Add New Deck"
                                icon="pi pi-plus"
                                size="small"
                                severity="primary"
                                [text]="true"
                                [outlined]="true"
                                [rounded]="true"
                                (onClick)="showAddDeckDialog.set(true)"
                                class="w-full opacity-70 hover:opacity-100 transition-opacity duration-200" />
                        </div>

                        <!-- Deck List -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div *ngFor="let deck of filteredDecks(); trackBy: trackByDeckId" 
                                 class="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-200 dark:border-surface-700 p-4 cursor-pointer deck-transition deck-list-item hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 relative group"
                                 [class.deck-favorite]="deck.isFavorite"
                                 [attr.data-deck-id]="deck.id"
                                 (click)="selectDeck(deck)">
                                
                                <!-- Action buttons - top right -->
                                <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div class="flex gap-1">
                                        <p-button 
                                            [icon]="deck.isFavorite ? 'pi pi-star-fill' : 'pi pi-star'" 
                                            [severity]="deck.isFavorite ? 'warn' : 'secondary'"
                                            size="small"
                                            text
                                            [rounded]="true"
                                            (click)="toggleFavorite($event, deck)"
                                            [pTooltip]="deck.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
                                            tooltipPosition="left"
                                            class="w-8 h-8" />
                                        <p-button 
                                            icon="pi pi-pencil" 
                                            severity="info"
                                            size="small"
                                            text
                                            [rounded]="true"
                                            (click)="editDeck($event, deck)"
                                            pTooltip="Edit deck"
                                            tooltipPosition="left"
                                            class="w-8 h-8" />
                                        <p-button 
                                            icon="pi pi-trash" 
                                            severity="danger"
                                            size="small"
                                            text
                                            [rounded]="true"
                                            (click)="deleteDeck($event, deck)"
                                            pTooltip="Delete deck"
                                            tooltipPosition="left"
                                            class="w-8 h-8" />
                                    </div>
                                </div>
                                
                                <!-- Card Header -->
                                <div class="mb-3 pr-10">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h3 class="text-surface-900 dark:text-surface-0 font-bold text-base line-height-3 truncate" 
                                            [pTooltip]="deck.name.length > 25 ? deck.name : ''"
                                            tooltipPosition="top">
                                            {{ deck.name }}
                                        </h3>
                                    </div>
                                    <p class="text-surface-600 dark:text-surface-400 text-sm m-0">{{ deck.course }}</p>
                                </div>
                                
                                <!-- Stats Badges -->
                                <div class="flex flex-wrap gap-2 mb-3">
                                    <div class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                        <i class="pi pi-plus-circle text-blue-600 dark:text-blue-400 text-xs"></i>
                                        <span class="text-blue-800 dark:text-blue-300 text-xs font-semibold">{{ deck.newCards }} New</span>
                                    </div>
                                    <div class="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                        <i class="pi pi-list text-green-600 dark:text-green-400 text-xs"></i>
                                        <span class="text-green-800 dark:text-green-300 text-xs font-semibold">{{ deck.totalCards }} Total</span>
                                    </div>
                                </div>
                                
                                <!-- Last Used -->
                                <div class="flex items-center gap-1 text-surface-500 dark:text-surface-400 text-xs">
                                    <i class="pi pi-clock text-xs"></i>
                                    <span *ngIf="deck.lastStudied; else neverStudied">
                                        Last used {{ formatLastStudied(deck.lastStudied) }}
                                    </span>
                                    <ng-template #neverStudied>
                                        <span class="text-surface-400 dark:text-surface-500">Never studied</span>
                                    </ng-template>
                                </div>
                                
                                <!-- Click indicator -->
                                <div class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <i class="pi pi-arrow-right text-primary text-sm"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Panel - Empty when no deck selected -->
                <div class="flex align-items-center justify-content-center p-8">
                    <!-- Empty space when no deck is selected -->
                </div>
            </div>

            <!-- Review Mode Template -->
            <ng-template #reviewMode>
                <div class="min-h-screen bg-white dark:bg-surface-900">
                    <!-- Breadcrumb Navigation - Top Left -->
                    <div class="px-8 pt-6 pb-4 border-b border-surface-200 dark:border-surface-700">
                        <div class="flex items-center justify-between">
                            <nav aria-label="Breadcrumb">
                                <ol class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                    <li>
                                        <button 
                                            (click)="endReviewSession()"
                                            class="flex items-center gap-1 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 font-medium">
                                            <i class="pi pi-home text-xs"></i>
                                            <span>All Decks</span>
                                        </button>
                                    </li>
                                    <li class="flex items-center">
                                        <i class="pi pi-angle-right text-xs text-surface-400 dark:text-surface-500 mx-2"></i>
                                        <span class="text-surface-600 dark:text-surface-300">{{ selectedDeck()?.course }}</span>
                                    </li>
                                    <li class="flex items-center">
                                        <i class="pi pi-angle-right text-xs text-surface-400 dark:text-surface-500 mx-2"></i>
                                        <span class="text-surface-900 dark:text-surface-0 font-semibold">{{ selectedDeck()?.name }}</span>
                                    </li>
                                </ol>
                            </nav>
                            
                            <!-- Back to Deck Button -->
                            <p-button 
                                label="Back to Deck"
                                icon="pi pi-arrow-left"
                                size="small"
                                severity="primary"
                                [text]="true"
                                [outlined]="true"
                                [rounded]="true"
                                (onClick)="endReviewSession()"
                                class="back-to-deck-btn" />
                        </div>
                    </div>

                    <!-- Main Content Area -->
                    <div class="w-full mx-auto px-8 pb-8 overflow-y-auto">
                        <div class="flex items-center justify-center min-h-[600px] pt-16">
                            <div class="w-full" *ngIf="currentCard()">
                                
                                <!-- Flashcard Container -->
                                <div class="relative mb-10 mt-8 overflow-visible max-w-4xl mx-auto">
                                        <div class="flashcard-container cursor-pointer" 
                                             [class]="'flashcard-container cursor-pointer ' + cardAnimationClass()"
                                             (click)="flipCard()">
                                            <div class="flashcard" [class.flipped]="showCardBack()">
                                                <!-- Front Side -->
                                                <div class="flashcard-face flashcard-front">
                                                    <!-- Card Header -->
                                                    <div class="absolute top-0 left-0 right-0 p-8 border-b border-surface-200 dark:border-surface-700 bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-900/50 dark:to-surface-800/50 rounded-t-3xl">
                                                        <div class="flex items-center justify-between">
                                                            <div class="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 font-semibold text-sm px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700">
                                                                Question
                                                            </div>
                                                            <div class="text-sm text-surface-500 dark:text-surface-400 font-medium">
                                                                Card {{ currentCardIndex() + 1 }} of {{ sampleFlashcards().length }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Card Content -->
                                                    <div class="pt-28 pb-24 px-12 min-h-[450px] flex items-center justify-center">
                                                        <div class="text-center w-full max-w-3xl">
                                                            <div class="text-2xl md:text-3xl lg:text-4xl font-medium text-surface-900 dark:text-surface-0 leading-relaxed">
                                                                {{ currentCard()?.front }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Card Footer -->
                                                    <div class="absolute bottom-0 left-0 right-0 p-8 border-t border-surface-200 dark:border-surface-700 bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-900/50 dark:to-surface-800/50 rounded-b-3xl">
                                                        <div class="text-center">
                                                            <div class="flex items-center justify-center text-surface-500 dark:text-surface-400">
                                                                <span class="text-sm font-medium">
                                                                    Click to reveal answer
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Back Side -->
                                                <div class="flashcard-face flashcard-back">
                                                    <!-- Card Header -->
                                                    <div class="absolute top-0 left-0 right-0 p-8 border-b border-surface-200 dark:border-surface-700 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50 rounded-t-3xl">
                                                        <div class="flex items-center justify-between">
                                                            <div class="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-semibold text-sm px-4 py-2 rounded-full border border-green-200 dark:border-green-700">
                                                                Answer
                                                            </div>
                                                            <div class="text-sm text-surface-500 dark:text-surface-400 font-medium">
                                                                Card {{ currentCardIndex() + 1 }} of {{ sampleFlashcards().length }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Card Content -->
                                                    <div class="pt-28 pb-24 px-12 min-h-[450px] flex items-center justify-center">
                                                        <div class="text-center w-full max-w-3xl">
                                                            <div class="text-2xl md:text-3xl lg:text-4xl font-medium text-surface-900 dark:text-surface-0 leading-relaxed">
                                                                {{ currentCard()?.back }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Card Footer -->
                                                    <div class="absolute bottom-0 left-0 right-0 p-8 border-t border-surface-200 dark:border-surface-700 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50 rounded-b-3xl">
                                                        <div class="text-center">
                                                            <div class="flex items-center justify-center gap-3 text-surface-500 dark:text-surface-400">
                                                                <div class="bg-green-100 dark:bg-green-700 rounded-full p-2">
                                                                    <i class="pi pi-check-circle text-lg text-green-600 dark:text-green-400"></i>
                                                                </div>
                                                                <span class="text-sm font-medium">
                                                                    Rate your knowledge below
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Review Buttons (only show when back is visible) -->
                                    <div class="flex justify-center mt-8" *ngIf="showCardBack()">
                                        <div class="grid grid-cols-4 gap-4 max-w-2xl w-full">
                                            <!-- Again Button -->
                                            <button 
                                                (click)="reviewCard('again')"
                                                class="group relative h-16 bg-surface-0 dark:bg-surface-800 hover:bg-red-50 dark:hover:bg-red-900/20 border border-surface-200 dark:border-surface-700 hover:border-red-300 dark:hover:border-red-600 rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.98]">
                                            <div class="flex flex-col items-center justify-center h-full">
                                                <i class="pi pi-times text-red-500 text-lg mb-2"></i>
                                                <span class="text-sm font-medium text-surface-900 dark:text-surface-0 group-hover:text-red-600 dark:group-hover:text-red-400">Try Again</span>
                                            </div>
                                        </button>
                                        
                                        <!-- Hard Button -->
                                        <button 
                                            (click)="reviewCard('hard')"
                                            class="group relative h-16 bg-surface-0 dark:bg-surface-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-surface-200 dark:border-surface-700 hover:border-orange-300 dark:hover:border-orange-600 rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.98]">
                                            <div class="flex flex-col items-center justify-center h-full">
                                                <i class="pi pi-exclamation-triangle text-orange-500 text-lg mb-2"></i>
                                                <span class="text-sm font-medium text-surface-900 dark:text-surface-0 group-hover:text-orange-600 dark:group-hover:text-orange-400">Hard</span>
                                            </div>
                                        </button>
                                        
                                        <!-- Easy Button -->
                                        <button 
                                            (click)="reviewCard('easy')"
                                            class="group relative h-16 bg-surface-0 dark:bg-surface-800 hover:bg-green-50 dark:hover:bg-green-900/20 border border-surface-200 dark:border-surface-700 hover:border-green-300 dark:hover:border-green-600 rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.98]">
                                            <div class="flex flex-col items-center justify-center h-full">
                                                <i class="pi pi-check-circle text-green-500 text-lg mb-2"></i>
                                                <span class="text-sm font-medium text-surface-900 dark:text-surface-0 group-hover:text-green-600 dark:group-hover:text-green-400">Easy</span>
                                            </div>
                                        </button>
                                        
                                        <!-- Mastered Button -->
                                        <button 
                                            (click)="reviewCard('good')"
                                            class="group relative h-16 bg-surface-0 dark:bg-surface-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-surface-200 dark:border-surface-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.98]">
                                            <div class="flex flex-col items-center justify-center h-full">
                                                <i class="pi pi-thumbs-up text-blue-500 text-lg mb-2"></i>
                                                <span class="text-sm font-medium text-surface-900 dark:text-surface-0 group-hover:text-blue-600 dark:group-hover:text-blue-400">Mastered</span>
                                            </div>
                                        </button>
                                        </div>
                                    </div>

                                    <!-- Card Navigation Bar -->
                                    <div class="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                                        <div class="flex items-center justify-center w-full relative">
                                            <!-- Compact Navigation Group - Moved Right -->
                                            <div class="flex items-center gap-3 ml-12">
                                                <!-- Previous Button -->
                                                <button 
                                                    (click)="previousCard()"
                                                    [disabled]="currentCardIndex() === 0"
                                                    class="flex items-center justify-center w-12 h-12 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 border border-gray-700 dark:border-gray-300 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black dark:disabled:hover:bg-white">
                                                    <i class="pi pi-chevron-left text-white dark:text-black text-lg"></i>
                                                </button>

                                                <!-- Card Counter -->
                                                <div class="flex items-center justify-center px-6 py-3 bg-black dark:bg-white rounded-full">
                                                    <div class="text-lg font-bold text-white dark:text-black">
                                                        {{ currentCardIndex() + 1 }}/{{ sampleFlashcards().length }}
                                                    </div>
                                                </div>

                                                <!-- Next Button -->
                                                <button 
                                                    (click)="nextCard()"
                                                    [disabled]="currentCardIndex() === sampleFlashcards().length - 1"
                                                    class="flex items-center justify-center w-12 h-12 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 border border-gray-700 dark:border-gray-300 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black dark:disabled:hover:bg-white">
                                                    <i class="pi pi-chevron-right text-white dark:text-black text-lg"></i>
                                                </button>
                                            </div>

                                            <!-- Shuffle Button - Positioned Absolutely -->
                                            <button 
                                                (click)="shuffleToRandomCard()"
                                                class="absolute right-0 flex items-center justify-center w-12 h-12 bg-gray-600 dark:bg-gray-400 hover:bg-gray-500 dark:hover:bg-gray-300 border border-gray-500 dark:border-gray-300 rounded-full transition-all duration-200"
                                                pTooltip="Shuffle"
                                                tooltipPosition="bottom">
                                                <i class="pi pi-refresh text-white dark:text-black text-lg"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- All Flashcards Section -->
                                    <div class="mt-12 pt-8 border-t border-surface-200 dark:border-surface-700">
                                        <div class="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0">All Cards in This Deck</h3>
                                            </div>
                                            <div class="flex items-center gap-3">
                                                <!-- Hide Answers Toggle -->
                                                <div class="flex items-center gap-2">
                                                    <label for="hideAnswersToggle" class="text-sm text-surface-600 dark:text-surface-400 cursor-pointer font-medium">
                                                        Hide Answers
                                                    </label>
                                                    <button
                                                        id="hideAnswersToggle"
                                                        type="button"
                                                        [class]="hideAnswers() ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'"
                                                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                                        (click)="hideAnswers.set(!hideAnswers())">
                                                        <span
                                                            [class]="hideAnswers() ? 'translate-x-6' : 'translate-x-1'"
                                                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-lg">
                                                        </span>
                                                    </button>
                                                </div>
                                                <!-- Add New Card Button -->
                                                <p-button 
                                                    label="Add New Card"
                                                    icon="pi pi-plus"
                                                    severity="primary"
                                                    size="small"
                                                    [text]="true"
                                                    [outlined]="true"
                                                    [rounded]="true"
                                                    (onClick)="showAddCardDialog.set(true)"
                                                    class="opacity-70 hover:opacity-100 transition-opacity duration-200" />
                                            </div>
                                        </div>

                                        <!-- Flashcards Grid -->
                                        <div class="overflow-y-auto max-h-[600px] scrollbar-thin">
                                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <div *ngFor="let card of sampleFlashcards(); let i = index" 
                                                     class="bg-surface-0 dark:bg-surface-800 border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 relative group min-h-[140px]"
                                                     [class.border-primary-500]="i === currentCardIndex()"
                                                     [class.ring-2]="i === currentCardIndex()"
                                                     [class.ring-primary-400]="i === currentCardIndex()"
                                                     [class.border-surface-200]="i !== currentCardIndex()"
                                                     [class.dark:border-surface-700]="i !== currentCardIndex()"
                                                     (click)="jumpToCard(i)">
                                                    
                                                    <!-- Card Header -->
                                                    <div class="flex items-center justify-between mb-2">
                                                        <div class="flex items-center gap-2">
                                                            <span class="text-xs font-bold text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-md">
                                                                Card {{ i + 1 }}
                                                            </span>
                                                            <span class="text-xs text-surface-500 dark:text-surface-400">
                                                                {{ card.status === 'learning' ? 'Learning' : card.status === 'review' ? 'Review' : 'New' }}
                                                            </span>
                                                        </div>
                                                        
                                                        <!-- Action buttons -->
                                                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <div class="flex gap-1">
                                                                <p-button 
                                                                    icon="pi pi-pencil" 
                                                                    severity="info"
                                                                    size="small"
                                                                    [text]="true"
                                                                    [rounded]="true"
                                                                    (click)="editCard($event, card)"
                                                                    pTooltip="Edit card"
                                                                    tooltipPosition="top"
                                                                    class="w-6 h-6" />
                                                                <p-button 
                                                                    icon="pi pi-trash" 
                                                                    severity="danger"
                                                                    size="small"
                                                                    [text]="true"
                                                                    [rounded]="true"
                                                                    (click)="deleteCard($event, card)"
                                                                    pTooltip="Delete card"
                                                                    tooltipPosition="top"
                                                                    class="w-6 h-6" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Card Content Preview -->
                                                    <div class="mb-2 flex-grow">
                                                        <div class="text-sm font-medium text-surface-900 dark:text-surface-0 mb-1 line-clamp-2">
                                                            {{ card.front }}
                                                        </div>
                                                        <div class="text-xs text-surface-600 dark:text-surface-400 line-clamp-1 transition-all duration-300"
                                                             [class.blur-sm]="hideAnswers()"
                                                             [class.select-none]="hideAnswers()">
                                                            Answer: {{ card.back }}
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Card Stats -->
                                                    <div class="flex items-center justify-between text-xs mt-auto">
                                                        <div class="flex gap-2">
                                                            <span class="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md font-medium">
                                                                Difficulty: {{ card.difficulty }}/5
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Current Card Indicator -->
                                                    <div *ngIf="i === currentCardIndex()" 
                                                         class="absolute bottom-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                        Current
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </ng-template>
        </div>
        
        <!-- Confirmation Dialog -->
        <p-confirmDialog header="Delete Deck" icon="pi pi-exclamation-triangle" />
        
        <!-- Add New Deck Dialog -->
        <p-dialog 
            [modal]="true" 
            [visible]="showAddDeckDialog()"
            [style]="{ width: '32rem' }"
            [draggable]="false"
            [resizable]="false"
            [showHeader]="false"
            (onHide)="hideAddDeckDialog()">
            
            <div class="p-6">
                <!-- Header -->
                <div class="mb-6">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Add a new flashcard deck</h2>
                    <p class="text-sm text-surface-600 dark:text-surface-400">Create a new deck to organize your flashcards by subject or topic</p>
                </div>
                
                <!-- Form -->
                <div class="flex flex-col space-y-4">
                    <!-- Deck Name -->
                    <div class="field">
                        <label for="deckName" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Deck Name *
                        </label>
                        <input 
                            pInputText 
                            id="deckName"
                            type="text"
                            placeholder="Enter deck name..."
                            maxlength="50"
                            [ngModel]="newDeckForm().name"
                            (ngModelChange)="updateNewDeckForm('name', $event)"
                            [class.ng-invalid]="showValidationErrors() && !newDeckForm().name.trim()"
                            class="w-full" />
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ newDeckForm().name.length }}/50 characters
                        </small>
                        <small 
                            *ngIf="showValidationErrors() && !newDeckForm().name.trim()" 
                            class="p-error block mt-1">
                            Deck name is required
                        </small>
                    </div>
                    
                    <!-- Subject -->
                    <div class="field">
                        <label for="subject" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Subject *
                        </label>
                        <input 
                            pInputText 
                            id="subject"
                            type="text"
                            placeholder="e.g., Mathematics, History, Biology..."
                            maxlength="30"
                            [ngModel]="newDeckForm().subject"
                            (ngModelChange)="updateNewDeckForm('subject', $event)"
                            [class.ng-invalid]="showValidationErrors() && !newDeckForm().subject.trim()"
                            class="w-full" />
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ newDeckForm().subject.length }}/30 characters
                        </small>
                        <small 
                            *ngIf="showValidationErrors() && !newDeckForm().subject.trim()" 
                            class="p-error block mt-1">
                            Subject is required
                        </small>
                    </div>
                    
                    <!-- Description -->
                    <div class="field">
                        <label for="description" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Description
                        </label>
                        <textarea 
                            pTextarea 
                            id="description"
                            rows="3"
                            placeholder="Brief description of this deck (optional)..."
                            maxlength="200"
                            [ngModel]="newDeckForm().description"
                            (ngModelChange)="updateNewDeckForm('description', $event)"
                            class="w-full resize-none"
                            style="min-height: 80px;">
                        </textarea>
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ newDeckForm().description.length }}/200 characters
                        </small>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex justify-end gap-4 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p-button 
                        label="Cancel" 
                        severity="secondary"
                        size="small"
                        [text]="true"
                        (onClick)="hideAddDeckDialog()" />
                    <p-button
                        type="button"
                        label="Create Deck"
                        severity="primary"
                        size="small"
                        [disabled]="!isNewDeckFormValid()"
                        (onClick)="createNewDeck()" />
                </div>
            </div>
        </p-dialog>

        <!-- Edit Deck Dialog -->
        <p-dialog 
            [modal]="true" 
            [visible]="showEditDeckDialog()"
            [style]="{ width: '32rem' }"
            [draggable]="false"
            [resizable]="false"
            [showHeader]="false"
            (onHide)="hideEditDeckDialog()">
            
            <div class="p-6">
                <!-- Header -->
                <div class="mb-6">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Edit flashcard deck</h2>
                    <p class="text-sm text-surface-600 dark:text-surface-400">Update your deck information</p>
                </div>
                
                <!-- Form -->
                <div class="flex flex-col space-y-4">
                    <!-- Deck Name -->
                    <div class="field">
                        <label for="editDeckName" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Deck Name *
                        </label>
                        <input 
                            pInputText 
                            id="editDeckName"
                            type="text"
                            placeholder="Enter deck name..."
                            maxlength="50"
                            [ngModel]="editDeckForm().name"
                            (ngModelChange)="updateEditDeckForm('name', $event)"
                            [class.ng-invalid]="showEditValidationErrors() && !editDeckForm().name.trim()"
                            class="w-full" />
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ editDeckForm().name.length }}/50 characters
                        </small>
                        <small 
                            *ngIf="showEditValidationErrors() && !editDeckForm().name.trim()" 
                            class="p-error block mt-1">
                            Deck name is required
                        </small>
                    </div>
                    
                    <!-- Subject -->
                    <div class="field">
                        <label for="editSubject" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Subject *
                        </label>
                        <input 
                            pInputText 
                            id="editSubject"
                            type="text"
                            placeholder="e.g., Mathematics, History, Biology..."
                            maxlength="30"
                            [ngModel]="editDeckForm().subject"
                            (ngModelChange)="updateEditDeckForm('subject', $event)"
                            [class.ng-invalid]="showEditValidationErrors() && !editDeckForm().subject.trim()"
                            class="w-full" />
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ editDeckForm().subject.length }}/30 characters
                        </small>
                        <small 
                            *ngIf="showEditValidationErrors() && !editDeckForm().subject.trim()" 
                            class="p-error block mt-1">
                            Subject is required
                        </small>
                    </div>
                    
                    <!-- Description -->
                    <div class="field">
                        <label for="editDescription" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Description
                        </label>
                        <textarea 
                            pTextarea 
                            id="editDescription"
                            rows="3"
                            placeholder="Brief description of this deck (optional)..."
                            maxlength="200"
                            [ngModel]="editDeckForm().description"
                            (ngModelChange)="updateEditDeckForm('description', $event)"
                            class="w-full resize-none"
                            style="min-height: 80px;">
                        </textarea>
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ editDeckForm().description.length }}/200 characters
                        </small>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex justify-end gap-4 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p-button 
                        label="Cancel" 
                        severity="secondary"
                        size="small"
                        [text]="true"
                        (onClick)="hideEditDeckDialog()" />
                    <p-button
                        type="button"
                        label="Update Deck"
                        severity="primary"
                        size="small"
                        [disabled]="!isEditDeckFormValid()"
                        (onClick)="updateDeck()" />
                </div>
            </div>
        </p-dialog>

        <!-- Add New Card Dialog -->
        <p-dialog 
            [modal]="true" 
            [visible]="showAddCardDialog()"
            [style]="{ width: '40rem' }"
            [draggable]="false"
            [resizable]="false"
            [showHeader]="false"
            (onHide)="hideAddCardDialog()">
            
            <div class="p-6">
                <!-- Header -->
                <div class="mb-6">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Add New Flashcard</h2>
                    <p class="text-sm text-surface-600 dark:text-surface-400">Create a new flashcard for the {{ selectedDeck()?.name }} deck</p>
                </div>
                
                <!-- Form -->
                <div class="flex flex-col space-y-5">
                    <!-- Front Side -->
                    <div class="field">
                        <label for="cardFront" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Question / Front Side *
                        </label>
                        <textarea 
                            pTextarea 
                            id="cardFront"
                            rows="4"
                            placeholder="Enter the question or front side content..."
                            maxlength="500"
                            [ngModel]="newCardForm().front"
                            (ngModelChange)="updateNewCardForm('front', $event)"
                            [class.ng-invalid]="showCardValidationErrors() && !newCardForm().front.trim()"
                            class="w-full resize-none"
                            style="min-height: 100px;">
                        </textarea>
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ newCardForm().front.length }}/500 characters
                        </small>
                        <small 
                            *ngIf="showCardValidationErrors() && !newCardForm().front.trim()" 
                            class="p-error block mt-1">
                            Question is required
                        </small>
                    </div>

                    <!-- Back Side -->
                    <div class="field">
                        <label for="cardBack" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Answer / Back Side *
                        </label>
                        <textarea 
                            pTextarea 
                            id="cardBack"
                            rows="4"
                            placeholder="Enter the answer or back side content..."
                            maxlength="500"
                            [ngModel]="newCardForm().back"
                            (ngModelChange)="updateNewCardForm('back', $event)"
                            [class.ng-invalid]="showCardValidationErrors() && !newCardForm().back.trim()"
                            class="w-full resize-none"
                            style="min-height: 100px;">
                        </textarea>
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ newCardForm().back.length }}/500 characters
                        </small>
                        <small 
                            *ngIf="showCardValidationErrors() && !newCardForm().back.trim()" 
                            class="p-error block mt-1">
                            Answer is required
                        </small>
                    </div>

                    <!-- Difficulty -->
                    <div class="field">
                        <label for="cardDifficulty" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Difficulty Level
                        </label>
                        <p-select 
                            [options]="difficultyOptions"
                            [ngModel]="newCardForm().difficulty"
                            (ngModelChange)="updateNewCardForm('difficulty', $event)"
                            placeholder="Select difficulty"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full" />
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            Rate the expected difficulty from 1 (very easy) to 5 (very hard)
                        </small>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex justify-end gap-4 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p-button 
                        label="Cancel" 
                        severity="secondary"
                        size="small"
                        [text]="true"
                        (onClick)="hideAddCardDialog()" />
                    <p-button
                        type="button"
                        label="Create Card"
                        severity="primary"
                        size="small"
                        [disabled]="!isNewCardFormValid()"
                        (onClick)="createNewCard()" />
                </div>
            </div>
        </p-dialog>

        <!-- Edit Card Dialog -->
        <p-dialog 
            [modal]="true" 
            [visible]="showEditCardDialog()"
            [style]="{ width: '40rem' }"
            [draggable]="false"
            [resizable]="false"
            [showHeader]="false"
            (onHide)="hideEditCardDialog()">
            
            <div class="p-6">
                <!-- Header -->
                <div class="mb-6">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Edit Flashcard</h2>
                    <p class="text-sm text-surface-600 dark:text-surface-400">Update your flashcard content</p>
                </div>
                
                <!-- Form -->
                <div class="flex flex-col space-y-5">
                    <!-- Front Side -->
                    <div class="field">
                        <label for="editCardFront" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Question / Front Side *
                        </label>
                        <textarea 
                            pTextarea 
                            id="editCardFront"
                            rows="4"
                            placeholder="Enter the question or front side content..."
                            maxlength="500"
                            [ngModel]="editCardForm().front"
                            (ngModelChange)="updateEditCardForm('front', $event)"
                            [class.ng-invalid]="showEditCardValidationErrors() && !editCardForm().front.trim()"
                            class="w-full resize-none"
                            style="min-height: 100px;">
                        </textarea>
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ editCardForm().front.length }}/500 characters
                        </small>
                        <small 
                            *ngIf="showEditCardValidationErrors() && !editCardForm().front.trim()" 
                            class="p-error block mt-1">
                            Question is required
                        </small>
                    </div>

                    <!-- Back Side -->
                    <div class="field">
                        <label for="editCardBack" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Answer / Back Side *
                        </label>
                        <textarea 
                            pTextarea 
                            id="editCardBack"
                            rows="4"
                            placeholder="Enter the answer or back side content..."
                            maxlength="500"
                            [ngModel]="editCardForm().back"
                            (ngModelChange)="updateEditCardForm('back', $event)"
                            [class.ng-invalid]="showEditCardValidationErrors() && !editCardForm().back.trim()"
                            class="w-full resize-none"
                            style="min-height: 100px;">
                        </textarea>
                        <small class="text-xs text-surface-500 dark:text-surface-400 block mt-1">
                            {{ editCardForm().back.length }}/500 characters
                        </small>
                        <small 
                            *ngIf="showEditCardValidationErrors() && !editCardForm().back.trim()" 
                            class="p-error block mt-1">
                            Answer is required
                        </small>
                    </div>

                    <!-- Difficulty -->
                    <div class="field">
                        <label for="editCardDifficulty" class="block text-sm font-medium text-left mb-2 text-surface-900 dark:text-surface-0">
                            Difficulty Level
                        </label>
                        <p-select 
                            [options]="difficultyOptions"
                            [ngModel]="editCardForm().difficulty"
                            (ngModelChange)="updateEditCardForm('difficulty', $event)"
                            placeholder="Select difficulty"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full" />
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex justify-end gap-4 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p-button 
                        label="Cancel" 
                        severity="secondary"
                        size="small"
                        [text]="true"
                        (onClick)="hideEditCardDialog()" />
                    <p-button
                        type="button"
                        label="Update Card"
                        severity="primary"
                        size="small"
                        [disabled]="!isEditCardFormValid()"
                        (onClick)="updateCard()" />
                </div>
            </div>
        </p-dialog>
    `
})
export class Flashcards implements OnInit {
    constructor(
        private confirmationService: ConfirmationService,
        public layoutService: LayoutService
    ) {}

    // Theme computed properties
    isDarkTheme = computed(() => this.layoutService.isDarkTheme());
    primaryColor = computed(() => this.layoutService.getPrimary());

    // Signals for reactive state management
    searchTerm = signal<string>('');
    selectedCourse = signal<string>('');
    showNewOnly = signal<boolean>(false);
    
    // Add new deck dialog state
    showAddDeckDialog = signal<boolean>(false);
    showValidationErrors = signal<boolean>(false);
    
    newDeckForm = signal<{
        name: string;
        subject: string;
        description: string;
    }>({
        name: '',
        subject: '',
        description: ''
    });

    // Edit deck dialog state
    showEditDeckDialog = signal<boolean>(false);
    showEditValidationErrors = signal<boolean>(false);
    editingDeckId = signal<string | null>(null);
    
    editDeckForm = signal<{
        name: string;
        subject: string;
        description: string;
    }>({
        name: '',
        subject: '',
        description: ''
    });
    
    // Add new card dialog state
    showAddCardDialog = signal<boolean>(false);
    showCardValidationErrors = signal<boolean>(false);
    
    newCardForm = signal<{
        front: string;
        back: string;
        difficulty: number;
    }>({
        front: '',
        back: '',
        difficulty: 3
    });

    // Edit card dialog state
    showEditCardDialog = signal<boolean>(false);
    showEditCardValidationErrors = signal<boolean>(false);
    editingCardId = signal<string | null>(null);
    
    editCardForm = signal<{
        front: string;
        back: string;
        difficulty: number;
    }>({
        front: '',
        back: '',
        difficulty: 3
    });
    
    // Flashcard review state
    selectedDeck = signal<FlashcardDeck | null>(null);
    currentCardIndex = signal<number>(0);
    showCardBack = signal<boolean>(false);
    reviewSession = signal<boolean>(false);
    hideAnswers = signal<boolean>(false);
    
    // Animation state for flashcard transitions
    cardAnimationClass = signal<string>('');
    isAnimating = signal<boolean>(false);

    // Sample Data
    decks = signal<FlashcardDeck[]>([
        {
            id: '1',
            name: 'Calculus Fundamentals',
            course: 'Mathematics',
            totalCards: 45,
            newCards: 8,
            color: 'blue',
            lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
            isFavorite: true,
            favoritedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // Favorited 2 days ago
        },
        {
            id: '2',
            name: 'Organic Chemistry Reactions',
            course: 'Chemistry',
            totalCards: 67,
            newCards: 5,
            color: 'green',
            lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
            id: '3',
            name: 'World War II Events',
            course: 'History',
            totalCards: 34,
            newCards: 12,
            color: 'purple',
            lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
            isFavorite: true,
            favoritedAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // Favorited 12 hours ago
        },
        {
            id: '4',
            name: 'Spanish Vocabulary',
            course: 'Languages',
            totalCards: 156,
            newCards: 20,
            color: 'orange',
            lastStudied: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        }
    ]);

    // Sample flashcards for review
    sampleFlashcards = signal<Flashcard[]>([
        {
            id: '1',
            front: 'What is the derivative of x²?',
            back: '2x',
            course: 'Mathematics',
            difficulty: 2,
            nextReview: new Date(),
            interval: 1,
            easeFactor: 2.5,
            reviewCount: 3,
            streak: 2,
            status: 'learning',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        },
        {
            id: '2',
            front: 'What is the integral of 2x?',
            back: 'x² + C',
            course: 'Mathematics',
            difficulty: 3,
            nextReview: new Date(),
            interval: 2,
            easeFactor: 2.3,
            reviewCount: 5,
            streak: 3,
            status: 'review',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14)
        },
        {
            id: '3',
            front: 'What is the limit definition of a derivative?',
            back: 'lim(h→0) [f(x+h) - f(x)] / h',
            course: 'Mathematics',
            difficulty: 4,
            nextReview: new Date(),
            interval: 3,
            easeFactor: 2.1,
            reviewCount: 8,
            streak: 1,
            status: 'review',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21)
        }
    ]);

    // Computed properties
    totalDecks = computed(() => this.decks().length);

    // Form validation
    isNewDeckFormValid = computed(() => {
        const form = this.newDeckForm();
        return form.name.trim().length > 0 && form.subject.trim().length > 0;
    });

    isEditDeckFormValid = computed(() => {
        const form = this.editDeckForm();
        return form.name.trim().length > 0 && form.subject.trim().length > 0;
    });

    // Card form validation
    isNewCardFormValid = computed(() => {
        const form = this.newCardForm();
        return form.front.trim().length > 0 && form.back.trim().length > 0;
    });

    isEditCardFormValid = computed(() => {
        const form = this.editCardForm();
        return form.front.trim().length > 0 && form.back.trim().length > 0;
    });

    // Difficulty options
    difficultyOptions = [
        { label: '1 - Very Easy', value: 1 },
        { label: '2 - Easy', value: 2 },
        { label: '3 - Medium', value: 3 },
        { label: '4 - Hard', value: 4 },
        { label: '5 - Very Hard', value: 5 }
    ];

    totalCards = computed(() => {
        return this.decks().reduce((total, deck) => total + deck.totalCards, 0);
    });

    masteredCards = computed(() => {
        // Mock calculation - in real app would calculate from card statuses
        return Math.floor(this.totalCards() * 0.6);
    });

    easyCards = computed(() => {
        // Mock calculation - in real app would calculate from card reviews
        return Math.floor(this.totalCards() * 0.25);
    });

    hardCards = computed(() => {
        // Mock calculation - in real app would calculate from card reviews
        return Math.floor(this.totalCards() * 0.15);
    });

    courseOptions = computed(() => {
        const courses = [...new Set(this.decks().map(deck => deck.course))];
        return [
            { label: 'All Courses', value: '' },
            ...courses.map(course => ({ label: course, value: course }))
        ];
    });

    filteredDecks = computed(() => {
        let filtered = this.decks();
        
        if (this.selectedCourse()) {
            filtered = filtered.filter(deck => deck.course === this.selectedCourse());
        }
        
        if (this.showNewOnly()) {
            filtered = filtered.filter(deck => deck.newCards > 0);
        }
        
        if (this.searchTerm()) {
            const term = this.searchTerm().toLowerCase();
            filtered = filtered.filter(deck => 
                deck.name.toLowerCase().includes(term) ||
                deck.course.toLowerCase().includes(term)
            );
        }
        
        // Sort: favorites first (by favoritedAt date), then regular decks
        return filtered.sort((a, b) => {
            // If both are favorites, sort by favoritedAt (earliest first for higher priority)
            if (a.isFavorite && b.isFavorite) {
                const aTime = a.favoritedAt?.getTime() || 0;
                const bTime = b.favoritedAt?.getTime() || 0;
                return aTime - bTime;
            }
            // If only one is favorite, favorite comes first
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            // If neither is favorite, maintain original order
            return 0;
        });
    });

    // Flashcard review computed properties
    currentCard = computed(() => {
        if (!this.selectedDeck() || this.sampleFlashcards().length === 0) return null;
        return this.sampleFlashcards()[this.currentCardIndex()] || null;
    });

    reviewProgress = computed(() => {
        if (!this.selectedDeck()) return { current: 0, total: 0, percentage: 0 };
        const total = this.sampleFlashcards().length;
        const current = this.currentCardIndex() + 1;
        return {
            current,
            total,
            percentage: Math.round((current / total) * 100)
        };
    });

    ngOnInit() {
        // Initialize with sample data
    }

    // Track by function for deck list animations
    trackByDeckId(index: number, deck: FlashcardDeck): string {
        return deck.id;
    }

    // Add new deck form methods
    hideAddDeckDialog() {
        this.showAddDeckDialog.set(false);
        this.showValidationErrors.set(false);
        this.resetNewDeckForm();
    }

    updateNewDeckForm(field: string, value: string) {
        this.newDeckForm.update(form => ({
            ...form,
            [field]: value
        }));
    }

    createNewDeck() {
        if (!this.isNewDeckFormValid()) {
            this.showValidationErrors.set(true);
            return;
        }

        const form = this.newDeckForm();
        const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newDeck: FlashcardDeck = {
            id: Date.now().toString(),
            name: form.name.trim(),
            course: form.subject.trim(),
            totalCards: 0,
            newCards: 0,
            color: randomColor
        };

        this.decks.update(decks => [...decks, newDeck]);
        this.hideAddDeckDialog();
    }

    resetNewDeckForm() {
        this.newDeckForm.set({
            name: '',
            subject: '',
            description: ''
        });
    }

    // Edit deck form methods
    editDeck(event: Event, deck: FlashcardDeck) {
        event.stopPropagation(); // Prevent deck selection when clicking edit
        
        this.editingDeckId.set(deck.id);
        this.editDeckForm.set({
            name: deck.name,
            subject: deck.course,
            description: '' // Add description field to FlashcardDeck interface if needed
        });
        this.showEditDeckDialog.set(true);
        this.showEditValidationErrors.set(false);
    }

    hideEditDeckDialog() {
        this.showEditDeckDialog.set(false);
        this.showEditValidationErrors.set(false);
        this.editingDeckId.set(null);
        this.resetEditDeckForm();
    }

    updateEditDeckForm(field: string, value: string) {
        this.editDeckForm.update(form => ({
            ...form,
            [field]: value
        }));
    }

    updateDeck() {
        if (!this.isEditDeckFormValid()) {
            this.showEditValidationErrors.set(true);
            return;
        }

        const form = this.editDeckForm();
        const deckId = this.editingDeckId();
        
        if (deckId) {
            this.decks.update(decks => 
                decks.map(deck => 
                    deck.id === deckId 
                        ? { ...deck, name: form.name.trim(), course: form.subject.trim() }
                        : deck
                )
            );
            
            this.hideEditDeckDialog();
        }
    }

    resetEditDeckForm() {
        this.editDeckForm.set({
            name: '',
            subject: '',
            description: ''
        });
    }

    // Add new card form methods
    hideAddCardDialog() {
        this.showAddCardDialog.set(false);
        this.showCardValidationErrors.set(false);
        this.resetNewCardForm();
    }

    updateNewCardForm(field: string, value: string | number) {
        this.newCardForm.update(form => ({
            ...form,
            [field]: value
        }));
    }

    createNewCard() {
        if (!this.isNewCardFormValid()) {
            this.showCardValidationErrors.set(true);
            return;
        }

        const form = this.newCardForm();

        const newCard: Flashcard = {
            id: Date.now().toString(),
            front: form.front.trim(),
            back: form.back.trim(),
            course: this.selectedDeck()?.course || 'General',
            difficulty: form.difficulty as 1 | 2 | 3 | 4 | 5,
            nextReview: new Date(),
            interval: 1,
            easeFactor: 2.5,
            reviewCount: 0,
            streak: 0,
            status: 'new',
            createdAt: new Date()
        };

        this.sampleFlashcards.update(cards => [...cards, newCard]);
        this.hideAddCardDialog();
    }

    resetNewCardForm() {
        this.newCardForm.set({
            front: '',
            back: '',
            difficulty: 3
        });
    }

    // Edit card form methods
    editCard(event: Event, card: Flashcard) {
        event.stopPropagation();
        
        this.editingCardId.set(card.id);
        this.editCardForm.set({
            front: card.front,
            back: card.back,
            difficulty: card.difficulty
        });
        this.showEditCardDialog.set(true);
        this.showEditCardValidationErrors.set(false);
    }

    hideEditCardDialog() {
        this.showEditCardDialog.set(false);
        this.showEditCardValidationErrors.set(false);
        this.editingCardId.set(null);
        this.resetEditCardForm();
    }

    updateEditCardForm(field: string, value: string | number) {
        this.editCardForm.update(form => ({
            ...form,
            [field]: value
        }));
    }

    updateCard() {
        if (!this.isEditCardFormValid()) {
            this.showEditCardValidationErrors.set(true);
            return;
        }

        const form = this.editCardForm();
        const cardId = this.editingCardId();
        
        if (cardId) {
            this.sampleFlashcards.update(cards => 
                cards.map(card => 
                    card.id === cardId 
                        ? { 
                            ...card, 
                            front: form.front.trim(), 
                            back: form.back.trim(),
                            difficulty: form.difficulty as 1 | 2 | 3 | 4 | 5
                        }
                        : card
                )
            );
            
            this.hideEditCardDialog();
        }
    }

    resetEditCardForm() {
        this.editCardForm.set({
            front: '',
            back: '',
            difficulty: 3
        });
    }

    // Card management methods
    deleteCard(event: Event, card: Flashcard) {
        event.stopPropagation();
        
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this flashcard? This action cannot be undone.`,
            header: 'Delete Card',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.sampleFlashcards.update(cards => cards.filter(c => c.id !== card.id));
                
                // If we deleted the current card, adjust the index
                if (this.currentCardIndex() >= this.sampleFlashcards().length) {
                    this.currentCardIndex.set(Math.max(0, this.sampleFlashcards().length - 1));
                }
                
                // Reset card back view when deleting
                this.showCardBack.set(false);
            }
        });
    }

    jumpToCard(index: number) {
        if (index === this.currentCardIndex() || this.isAnimating()) {
            return;
        }
        
        const currentIndex = this.currentCardIndex();
        const isForward = index > currentIndex;
        
        this.isAnimating.set(true);
        this.cardAnimationClass.set(isForward ? 'flashcard-slide-enter' : 'flashcard-slide-enter-prev');
        
        setTimeout(() => {
            this.currentCardIndex.set(index);
            this.showCardBack.set(false);
            
            setTimeout(() => {
                this.cardAnimationClass.set('');
                this.isAnimating.set(false);
            }, 50);
        }, 150);
    }

    toggleFavorite(event: Event, deck: FlashcardDeck) {
        event.stopPropagation(); // Prevent deck selection when clicking favorite
        
        const deckElement = (event.target as HTMLElement).closest('.deck-list-item') as HTMLElement;
        const wasFavorite = deck.isFavorite;
        
        if (deckElement) {
            if (!wasFavorite) {
                // Adding to favorites - apply favorite styling with animation
                deckElement.classList.add('deck-slide-up');
                
                // Update the data immediately so Angular re-renders in correct order
                this.updateDeckFavoriteStatus(deck.id, true);
                
                // Clean up animation class after animation completes
                setTimeout(() => {
                    deckElement.classList.remove('deck-slide-up');
                    deckElement.classList.add('deck-favorite-enter');
                    
                    setTimeout(() => {
                        deckElement.classList.remove('deck-favorite-enter');
                    }, 500);
                }, 600);
                
            } else {
                // Removing from favorites - apply slide down animation
                deckElement.classList.add('deck-slide-down');
                
                // Update the data after a short delay to allow animation to start
                setTimeout(() => {
                    this.updateDeckFavoriteStatus(deck.id, false);
                }, 100);
                
                // Clean up animation class
                setTimeout(() => {
                    if (deckElement.parentNode) {
                        deckElement.classList.remove('deck-slide-down');
                    }
                }, 400);
            }
        } else {
            // Fallback if element not found
            this.updateDeckFavoriteStatus(deck.id, !wasFavorite);
        }
    }

    private updateDeckFavoriteStatus(deckId: string, isFavorite: boolean) {
        this.decks.update(decks => 
            decks.map(d => 
                d.id === deckId 
                    ? { 
                        ...d, 
                        isFavorite: isFavorite,
                        favoritedAt: isFavorite ? new Date() : undefined
                    }
                    : d
            )
        );
    }

    selectDeck(deck: FlashcardDeck) {
        this.selectedDeck.set(deck);
        this.currentCardIndex.set(0);
        this.showCardBack.set(false);
        this.reviewSession.set(true);
    }

    deleteDeck(event: Event, deck: FlashcardDeck) {
        event.stopPropagation(); // Prevent deck selection when clicking delete
        
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${deck.name}"? This action cannot be undone.`,
            header: 'Delete Deck',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                // Remove deck from the list
                this.decks.update(decks => decks.filter(d => d.id !== deck.id));
                
                // If this was the selected deck, clear the selection
                if (this.selectedDeck()?.id === deck.id) {
                    this.endReviewSession();
                }
            }
        });
    }

    // Flashcard review methods
    flipCard() {
        this.showCardBack.set(!this.showCardBack());
    }

    reviewCard(difficulty: 'again' | 'hard' | 'good' | 'easy') {
        // In a full implementation, this would update spaced repetition algorithm
        
        // Move to next card
        const totalCards = this.sampleFlashcards().length;
        if (this.currentCardIndex() < totalCards - 1) {
            this.currentCardIndex.set(this.currentCardIndex() + 1);
            this.showCardBack.set(false);
        } else {
            // End of review session
            this.endReviewSession();
        }
    }

    endReviewSession() {
        this.reviewSession.set(false);
        this.selectedDeck.set(null);
        this.currentCardIndex.set(0);
        this.showCardBack.set(false);
    }

    previousCard() {
        if (this.currentCardIndex() > 0 && !this.isAnimating()) {
            this.isAnimating.set(true);
            this.cardAnimationClass.set('flashcard-slide-enter-prev');
            
            setTimeout(() => {
                this.currentCardIndex.set(this.currentCardIndex() - 1);
                this.showCardBack.set(false);
                
                setTimeout(() => {
                    this.cardAnimationClass.set('');
                    this.isAnimating.set(false);
                }, 50);
            }, 150);
        }
    }

    nextCard() {
        const totalCards = this.sampleFlashcards().length;
        if (this.currentCardIndex() < totalCards - 1 && !this.isAnimating()) {
            this.isAnimating.set(true);
            this.cardAnimationClass.set('flashcard-slide-enter');
            
            setTimeout(() => {
                this.currentCardIndex.set(this.currentCardIndex() + 1);
                this.showCardBack.set(false);
                
                setTimeout(() => {
                    this.cardAnimationClass.set('');
                    this.isAnimating.set(false);
                }, 50);
            }, 150);
        }
    }

    shuffleToRandomCard() {
        const totalCards = this.sampleFlashcards().length;
        if (totalCards <= 1 || this.isAnimating()) {
            return;
        }
        
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * totalCards);
        } while (randomIndex === this.currentCardIndex());
        
        this.isAnimating.set(true);
        
        // Use appropriate animation based on direction
        const isNext = randomIndex > this.currentCardIndex();
        this.cardAnimationClass.set(isNext ? 'flashcard-slide-enter' : 'flashcard-slide-enter-prev');
        
        setTimeout(() => {
            this.currentCardIndex.set(randomIndex);
            this.showCardBack.set(false);
            
            setTimeout(() => {
                this.cardAnimationClass.set('');
                this.isAnimating.set(false);
            }, 50);
        }, 150);
    }

    formatLastStudied(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return `${diffDays}d ago`;
        }
    }
}
