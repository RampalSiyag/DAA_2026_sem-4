//Problem 2: Implement queue using Linked List
#include <bits/stdc++.h>
using namespace std;
class Node {
public:   int data;
    Node* next;

    Node(int value) {
        data = value;
        next = nullptr;
    }
};

class Queue {
private:    Node* front;
    Node* rear;
public:    Queue() {
        front = rear = nullptr;
    }
    void push(int value) {
        Node* newNode = new Node(value);
        if (rear == nullptr) {
            front = rear = newNode;
            return;
        }
        rear->next = newNode;
        rear = newNode;
    }
    void pop() {
        if (front == nullptr) return;
        Node* temp = front;
        front = front->next;
        delete temp;
        if (front == nullptr) rear = nullptr;
    }
    int peek() {
        if (front == nullptr) 
        {
            throw runtime_error("Queue is empty");
        }
        return front->data;
    }
    bool empty() {
        return front == nullptr;
    }
};