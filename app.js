// Simple Trello App
class TrelloApp {
    constructor() {
        this.board = document.getElementById('board');
        this.columnCount = 0;
        this.loadFromLocalStorage();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add column button
        document.getElementById('add-column-btn').addEventListener('click', () => this.addColumn());

        // Save to localStorage on page unload
        window.addEventListener('beforeunload', () => this.saveToLocalStorage());
    }

    addColumn(title = `Column ${this.columnCount + 1}`) {
        const columnId = `column-${Date.now()}`;
        const column = document.createElement('div');
        column.className = 'column';
        column.dataset.id = columnId;

        column.innerHTML = `
            <div class="column-header">
                <span class="column-title" contenteditable="true">${title}</span>
                <button class="delete-column-btn" title="Delete column">&times;</button>
            </div>
            <div class="column-content" data-drop-target="true"></div>
            <button class="add-card-btn">+ Add a card</button>
        `;

        this.board.appendChild(column);
        this.columnCount++;

        // Add event listeners for the new column
        this.setupColumnListeners(column);

        // Save to localStorage after adding
        setTimeout(() => this.saveToLocalStorage(), 100);
    }

    setupColumnListeners(column) {
        const deleteBtn = column.querySelector('.delete-column-btn');
        const addCardBtn = column.querySelector('.add-card-btn');
        const columnHeader = column.querySelector('.column-header');

        // Delete column
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete this column?')) {
                column.remove();
                this.saveToLocalStorage();
            }
        });

        // Add card button
        addCardBtn.addEventListener('click', () => this.addCard(column));

        // Column title edit
        columnHeader.querySelector('.column-title').addEventListener('blur', (e) => {
            this.saveToLocalStorage();
        });

        columnHeader.querySelector('.column-title').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') e.target.blur();
        });
    }

    addCard(column, text = 'New card') {
        const columnContent = column.querySelector('.column-content');
        const cardId = `card-${Date.now()}`;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;
        card.dataset.id = cardId;

        card.innerHTML = `
            <span class="card-text" contenteditable="true">${text}</span>
            <div class="card-actions">
                <button class="delete-card-btn" title="Delete card">&times;</button>
            </div>
        `;

        columnContent.appendChild(card);
        this.setupCardListeners(card, columnContent);

        // Scroll to bottom of column
        columnContent.scrollTop = columnContent.scrollHeight;

        // Save to localStorage after adding
        setTimeout(() => this.saveToLocalStorage(), 100);
    }

    setupCardListeners(card, columnContent) {
        // Drag and drop events for the card
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.saveToLocalStorage();
        });

        // Delete card
        card.querySelector('.delete-card-btn').addEventListener('click', (e) => {
            if (confirm('Delete this card?')) {
                card.remove();
                this.saveToLocalStorage();
            }
        });

        // Card text edit
        card.querySelector('.card-text').addEventListener('blur', (e) => {
            this.saveToLocalStorage();
        });

        card.querySelector('.card-text').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') e.target.blur();
        });

        // Drag and drop events for the column content area
        columnContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(columnContent, e.clientY);
            
            columnContent.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            
            if (afterElement == null) {
                columnContent.appendChild(card);
            } else {
                columnContent.insertBefore(card, afterElement);
            }
            
            card.classList.add('drag-over');
        });

        columnContent.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        columnContent.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    saveToLocalStorage() {
        const columns = [];
        
        document.querySelectorAll('.column').forEach(column => {
            const columnData = {
                id: column.dataset.id,
                title: column.querySelector('.column-title').innerText,
                cards: []
            };

            column.querySelectorAll('.card').forEach(card => {
                columnData.cards.push({
                    id: card.dataset.id,
                    text: card.querySelector('.card-text').innerText
                });
            });

            columns.push(columnData);
        });

        localStorage.setItem('trello-board', JSON.stringify(columns));
    }

    loadFromLocalStorage() {
        const savedBoard = localStorage.getItem('trello-board');
        
        if (savedBoard) {
            try {
                const columns = JSON.parse(savedBoard);
                
                columns.forEach(columnData => {
                    this.addColumn(columnData.title);
                    
                    // Add cards to the newly created column
                    const newColumn = this.board.lastElementChild;
                    columnData.cards.forEach(cardData => {
                        this.addCard(newColumn, cardData.text);
                    });
                });

                this.columnCount = columns.length;
            } catch (e) {
                console.error('Error loading board from localStorage:', e);
                // Add initial column if there's an error
                this.addColumn();
            }
        } else {
            // Add initial column
            this.addColumn();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TrelloApp();
});
