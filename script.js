class ExpenseTracker {
  constructor() {
    this.expenses = this.loadFromStorage();
    this.editingId = null;
    this.initializeEventListeners();
    this.updateDisplay();
    this.setDefaultDate();
  }

  // Initialize all event listeners
  initializeEventListeners() {
    // Form submission
    document.getElementById("expenseForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // Cancel edit
    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.cancelEdit();
    });

    // Filter and sort listeners
    document.getElementById("filterType").addEventListener("change", () => {
      this.updateDisplay();
    });

    document.getElementById("filterDateFrom").addEventListener("change", () => {
      this.updateDisplay();
    });

    document.getElementById("filterDateTo").addEventListener("change", () => {
      this.updateDisplay();
    });

    document.getElementById("sortBy").addEventListener("change", () => {
      this.updateDisplay();
    });

    // Real-time form validation
    ["description", "amount", "date", "type"].forEach((field) => {
      document.getElementById(field).addEventListener("blur", () => {
        this.validateField(field);
      });
    });
  }

  // Set default date to today
  setDefaultDate() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("date").value = today;
  }

  // Load data from localStorage
  loadFromStorage() {
    try {
      const data = JSON.parse(localStorage.getItem("expenses") || "[]");
      return data.map((expense) => ({
        ...expense,
        id: expense.id || this.generateId(),
      }));
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return [];
    }
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      localStorage.setItem("expenses", JSON.stringify(this.expenses));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      this.showMessage("Error saving data. Please try again.", "error");
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Validate individual field
  validateField(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + "Error");
    let isValid = true;
    let errorMessage = "";

    switch (fieldName) {
      case "description":
        if (!field.value.trim()) {
          errorMessage = "Description is required";
          isValid = false;
        } else if (field.value.trim().length < 3) {
          errorMessage = "Description must be at least 3 characters";
          isValid = false;
        }
        break;

      case "amount":
        if (!field.value) {
          errorMessage = "Amount is required";
          isValid = false;
        } else if (parseFloat(field.value) <= 0) {
          errorMessage = "Amount must be greater than 0";
          isValid = false;
        }
        break;

      case "date":
        if (!field.value) {
          errorMessage = "Date is required";
          isValid = false;
        }
        break;

      case "type":
        if (!field.value) {
          errorMessage = "Transaction type is required";
          isValid = false;
        }
        break;
    }

    errorElement.textContent = errorMessage;
    field.style.borderColor = isValid ? "#e1e8ed" : "#e74c3c";

    return isValid;
  }

  // Validate entire form
  validateForm() {
    const fields = ["description", "amount", "date", "type"];
    let isFormValid = true;

    fields.forEach((field) => {
      if (!this.validateField(field)) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }

  // Handle form submission
  handleFormSubmit() {
    if (!this.validateForm()) {
      return;
    }

    const formData = new FormData(document.getElementById("expenseForm"));
    const expense = {
      id: this.editingId || this.generateId(),
      description: formData.get("description").trim(),
      amount: parseFloat(formData.get("amount")),
      date: formData.get("date"),
      type: formData.get("type"),
      timestamp: new Date().toISOString(),
    };

    if (this.editingId) {
      // Update existing expense
      const index = this.expenses.findIndex((exp) => exp.id === this.editingId);
      if (index !== -1) {
        this.expenses[index] = { ...this.expenses[index], ...expense };
        this.showMessage("Transaction updated successfully!", "success");
      }
      this.cancelEdit();
    } else {
      // Add new expense
      this.expenses.push(expense);
      this.showMessage("Transaction added successfully!", "success");
    }

    this.saveToStorage();
    this.updateDisplay();
    this.resetForm();
  }

  // Show success/error message
  showMessage(message, type = "success") {
    const messageElement = document.getElementById("successMessage");
    messageElement.textContent = message;
    messageElement.className = type;
    messageElement.style.display = "block";

    setTimeout(() => {
      messageElement.style.display = "none";
    }, 3000);
  }

  // Reset form
  resetForm() {
    document.getElementById("expenseForm").reset();
    this.setDefaultDate();
    this.clearErrors();
  }

  // Clear form errors
  clearErrors() {
    ["description", "amount", "date", "type"].forEach((field) => {
      document.getElementById(field + "Error").textContent = "";
      document.getElementById(field).style.borderColor = "#e1e8ed";
    });
  }

  // Start editing expense
  editExpense(id) {
    const expense = this.expenses.find((exp) => exp.id === id);
    if (!expense) return;

    this.editingId = id;

    // Populate form
    document.getElementById("description").value = expense.description;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("date").value = expense.date;
    document.getElementById("type").value = expense.type;

    // Update UI
    document.getElementById("formTitle").textContent = "Edit Transaction";
    document.getElementById("submitBtn").textContent = "Update Transaction";
    document.getElementById("cancelBtn").style.display = "inline-block";

    // Scroll to form
    document
      .querySelector(".form-section")
      .scrollIntoView({ behavior: "smooth" });
  }

  // Cancel edit
  cancelEdit() {
    this.editingId = null;
    document.getElementById("formTitle").textContent = "Add New Transaction";
    document.getElementById("submitBtn").textContent = "Add Transaction";
    document.getElementById("cancelBtn").style.display = "none";
    this.resetForm();
  }

  // Delete expense
  deleteExpense(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
      this.expenses = this.expenses.filter((exp) => exp.id !== id);
      this.saveToStorage();
      this.updateDisplay();
      this.showMessage("Transaction deleted successfully!", "success");

      // Cancel edit if we're editing the deleted expense
      if (this.editingId === id) {
        this.cancelEdit();
      }
    }
  }

  // Get filtered and sorted expenses
  getFilteredExpenses() {
    let filtered = [...this.expenses];

    // Filter by type
    const typeFilter = document.getElementById("filterType").value;
    if (typeFilter) {
      filtered = filtered.filter((exp) => exp.type === typeFilter);
    }

    // Filter by date range
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;

    if (dateFrom) {
      filtered = filtered.filter((exp) => exp.date >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter((exp) => exp.date <= dateTo);
    }

    // Sort
    const sortBy = document.getElementById("sortBy").value;
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  }

  // Calculate totals
  calculateTotals() {
    const income = this.expenses
      .filter((exp) => exp.type === "income")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const expenses = this.expenses
      .filter((exp) => exp.type === "expense")
      .reduce((sum, exp) => sum + exp.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RWF",
    }).format(amount);
  }

  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Update display
  updateDisplay() {
    this.updateTotals();
    this.updateExpensesList();
  }

  // Update totals display
  updateTotals() {
    const totals = this.calculateTotals();

    document.getElementById("totalBalance").textContent = this.formatCurrency(
      totals.balance
    );
    document.getElementById("totalIncome").textContent = this.formatCurrency(
      totals.income
    );
    document.getElementById("totalExpenses").textContent = this.formatCurrency(
      totals.expenses
    );
  }

  // Update expenses list
  updateExpensesList() {
    const expensesList = document.getElementById("expensesList");
    const filteredExpenses = this.getFilteredExpenses();

    if (filteredExpenses.length === 0) {
      expensesList.innerHTML = `
                <div class="empty-state">
                    <h3>No transactions found</h3>
                    <p>Try adjusting your filters or add a new transaction.</p>
                </div>
            `;
      return;
    }

    expensesList.innerHTML = filteredExpenses
      .map(
        (expense) => `
            <div class="expense-item ${expense.type}">
                <div class="expense-header">
                    <div class="expense-info">
                        <h3>${this.escapeHtml(expense.description)}</h3>
                        <div class="expense-date">${this.formatDate(
                          expense.date
                        )}</div>
                    </div>
                    <div>
                        <div class="expense-amount ${expense.type}">
                            ${this.formatCurrency(expense.amount)}
                        </div>
                        <div class="expense-actions">
                            <button class="btn btn-small btn-edit" onclick="tracker.editExpense('${
                              expense.id
                            }')">
                                Edit
                            </button>
                            <button class="btn btn-small btn-delete" onclick="tracker.deleteExpense('${
                              expense.id
                            }')">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the expense tracker when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  window.tracker = new ExpenseTracker();
});
