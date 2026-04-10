export interface ReviewState {
    id: number;
    userId: number;
    egId : number;
    intervalDays: number;
    ef: number;
    repetitions : number;
    lastReview: string;
    nextReview: string;
    createDate: string;
    updateDate: string;
    strength?: number;
    difficulty?: number;
    forgettingIdx?: number;
}
