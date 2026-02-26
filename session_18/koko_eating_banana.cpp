class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        long long total = 0;
        int rt = 0;
        for (int i : piles) {
            total = total + i;
            if (i > rt) rt = i;
        }
        int lt = (total + h - 1) / h;

        while (lt < rt) {
            int mid = lt + (rt - lt) / 2;
            long long sum = 0;
            for (int i : piles) {
                sum = sum + (i + mid - 1) / mid;
                if (sum > h) break;
            }
            if (sum <= h) {
                rt = mid;
            }
            else {
                lt = mid + 1;
            }
        }

        return lt;
    }
};