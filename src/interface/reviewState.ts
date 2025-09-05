export interface ReviewState {
    id: number;
    userId: number;
    egId : number;
    intervalDays: number;
    strength: number;
    difficulty: number;
    forgettingIdx: number;
    repetitions : number;
    lastReview: string;
    nextReview: string;
    createDate: string;
    updateDate: string;
}