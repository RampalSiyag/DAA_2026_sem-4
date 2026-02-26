class Solution {
public:

    bool canPlace(vector<int>& stalls, int k, int i) {
        int count = 1;
        int lastPos = stalls[0];
        for (int j = 1; j < stalls.size(); j++) {
            if (stalls[j] - lastPos >= i) {
                count++;
                lastPosition = stalls[j];
                if (count >= k) return true;
            }
        }
        return false;
    }

    int aggressiveCows(vector<int>& stalls, int k) {
        sort(stalls.begin(), stalls.end());
        int low = 1;
        int high = stalls.back() - stalls.front();
        int ans = 0;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (canPlace(stalls, k, mid)) {
                ans = mid;
                low = mid + 1;
            }
            else {
                high = mid - 1;
            }
        }
        return ans;
    }
};