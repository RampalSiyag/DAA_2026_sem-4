#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    int N;
    cin >> N;  

       vector<char> attendance(N);
    for (int i = 0; i < N; i++) {
        cin >> attendance[i];  
    }

    unordered_map<int, int> mp;  
    int sum = 0, maxLen = 0;

    mp[0] = -1; 

    for (int i = 0; i < N; i++) {
        if (attendance[i] == 'P') sum += 1;
        else sum -= 1;

        if (mp.count(sum)) {
            int prevIndex = mp[sum];
            maxLen = max(maxLen, i - prevIndex);
        } else {
            mp[sum] = i;
        }
    }

    cout << maxLen << endl;
    return 0;
}
