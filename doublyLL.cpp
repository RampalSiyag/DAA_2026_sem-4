#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* prev;
    Node* next;
};

Node* head = NULL;

void insertAtBeginning(int value) {
    Node* newNode = new Node();
    newNode->data = value;
    newNode->prev = nullptr;
    newNode->next = head;
    if (head != nullptr) {
        head->prev = newNode;
    }
    head = newNode;
}

void insertAtEnd(int value) {
    Node* newNode = new Node();
    newNode->data = value;
    newNode->next = nullptr;
    if (head == nullptr) {
        newNode->prev = nullptr;
        head = newNode;
        return;
    }

    Node* temp = head;
    while (temp->next != nullptr) {
        temp = temp->next;
    }
    temp->next = newNode;
    newNode->prev = temp;
}

void insertAtPosition(int value, int pos) {
    if (pos == 1) {
        insertAtBeginning(value);
        return;
    }

    Node* temp = head;
    for (int i = 1; i < pos - 1 && temp != nullptr; i++) {
        temp = temp->next;
    }
    if (temp == nullptr) {
        cout << "Invalid position\n";
        return;
    }

    Node* newNode = new Node();
    newNode->data = value;
    newNode->next = temp->next;
    newNode->prev = temp;

    if (temp->next != nullptr) {
        temp->next->prev = newNode;
    }
    temp->next = newNode;
}

void deleteAtPosition(int pos) {
    if (head == nullptr) {
        return;
    } 
    Node* temp = head;

    if (pos == 1) {
        head = head->next;
        if (head != nullptr) {
            head->prev = nullptr;
        }
        delete temp;
        return;
    }

    for (int i = 1; i < pos && temp != nullptr; i++) {
        temp = temp->next;
    }
    if (temp == nullptr) {
        cout << "Invalid position\n";
        return;
    }

    if (temp->prev != nullptr) {
        temp->prev->next = temp->next;
    }
    if (temp->next != nullptr) {
        temp->next->prev = temp->prev;
    }
    delete temp;
}

void display() {
    Node* temp = head;
    while (temp != nullptr) {
        cout << temp->data <<" --> ";
        temp = temp->next;
    }
    cout <<"NULL"<< endl;
}

void displayReverse() {
    Node* temp = head;
    if (temp == nullptr) {
        return;
    }

    while (temp->next != nullptr) {
        temp = temp->next;
    }
    while (temp != nullptr) {
        cout << temp->data <<" --> ";
        temp = temp->prev;
    }
    cout <<"NULL"<< endl;
}

int main() {
    insertAtBeginning(10);
    insertAtBeginning(5);
    cout << "After inserting at beginning:\n";
    display();
    insertAtEnd(20);
    insertAtEnd(25);
    cout << "After inserting at end:\n";
    display();
    insertAtPosition(15, 3);
    cout << "After inserting 15 at position 3:\n";
    display();
    deleteAtPosition(2);
    cout << "After deleting element at position 2:\n";
    display();
    cout << "List in reverse order:\n";
    displayReverse();
    return 0;
}


// Time complexities for operations:

// Insert at Beginning    -->    O(1)
// Insert at End          -->    O(n)
// Insert at Position     -->    O(n)
// Delete at Position     -->    O(n)
// Display (Both forward and reverse)    -->    O(n)

