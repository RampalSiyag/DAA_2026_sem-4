#include<iostream>
#include<vector>
using namespace std;

int lowerBound(vector<int>& vec, int val) {
    int n = vec.size();
    int st = 0, end = n - 1;
    int ans = n;
    while (st <= end) {
        int mid = st + (end - st) / 2;
        if (vec[mid] >= val) {
            ans = mid;
            end = mid - 1;
        }
        else {
            st = mid + 1;
        }
    }
    return ans;
}

int upperBound(vector<int>& vec, int val) {
    int n = vec.size();
    int st = 0, end = n - 1;
    int ans = n;
    while (st <= end) {
        int mid = st + (end - st) / 2;
        if (vec[mid] > val) {
            ans = mid;
            end = mid - 1;
        }
        else {
            st = mid + 1;
        }
    }
    return ans;
}

int main() {


    return 0;
}