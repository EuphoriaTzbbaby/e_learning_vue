#include <stdio.h>
#include <stdlib.h>
int main() {
    int n;
    scanf("%d", &n);
    int* nums = (int*) malloc(sizeof(int) * n);
    for(int i = 0; i < n; i += 1) {
        scanf("%d", &nums[i]);
    }
    int u = 1 << n;
    int** ans = (int**) malloc(sizeof(int*) * u);
    int* f = (int*) malloc(sizeof(int) * n);
    int* memo = (int*) malloc(sizeof(int) * u);
    for(int mask = 0; mask < u; mask += 1) {
        int cur = 0;
        for(int i = 0; i < n; i += 1) {
            if((mask >> i) & 1 == 1) {
                f[cur] = nums[i];
                cur += 1;
            }
        }
        int* res = (int*) malloc(sizeof(int) * cur);
        for(int i = 0; i < cur; i += 1) {
            res[i] = f[i];
        }
        ans[mask] = (int*) malloc(sizeof(int) * cur);
        ans[mask] = res;
        memo[mask] = cur;
    }
    for(int mask = 0; mask < u; mask += 1) {
        for(int j = 0; j < memo[mask]; j += 1) {
            printf("%d ", ans[mask][j]);
        }
        printf("\n");
    }
    return 0;
}