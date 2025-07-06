import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Ticket {
  id: string;
  numbers: string;
  purchaseDate: string;
  source: 'manual' | 'sms';
}

export interface WinningNumber {
  id: string;
  numbers: string;
  drawDate: string;
  month: string;
}

export interface TicketResult {
  id: string;
  numbers: string;
  isWinner: boolean;
  matchCount: number;
  purchaseDate: string;
}

const TICKETS_KEY = 'lottery_tickets';
const WINNING_NUMBERS_KEY = 'winning_numbers';

// Ticket Management
export const saveTicket = async (ticket: Ticket): Promise<void> => {
  try {
    const existingTickets = await getTickets();
    const updatedTickets = [...existingTickets, ticket];
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updatedTickets));
  } catch (error) {
    console.error('Error saving ticket:', error);
    throw error;
  }
};

export const getTickets = async (): Promise<Ticket[]> => {
  try {
    const ticketsJson = await AsyncStorage.getItem(TICKETS_KEY);
    return ticketsJson ? JSON.parse(ticketsJson) : [];
  } catch (error) {
    console.error('Error getting tickets:', error);
    return [];
  }
};

export const deleteTicket = async (ticketId: string): Promise<void> => {
  try {
    const existingTickets = await getTickets();
    const filteredTickets = existingTickets.filter(ticket => ticket.id !== ticketId);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(filteredTickets));
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

// Winning Numbers Management
export const saveWinningNumber = async (winningNumber: WinningNumber): Promise<void> => {
  try {
    const existingNumbers = await getWinningNumbers();
    const updatedNumbers = [...existingNumbers, winningNumber];
    await AsyncStorage.setItem(WINNING_NUMBERS_KEY, JSON.stringify(updatedNumbers));
  } catch (error) {
    console.error('Error saving winning number:', error);
    throw error;
  }
};

export const getWinningNumbers = async (): Promise<WinningNumber[]> => {
  try {
    const numbersJson = await AsyncStorage.getItem(WINNING_NUMBERS_KEY);
    const numbers = numbersJson ? JSON.parse(numbersJson) : [];
    
    // Sort by date (newest first)
    return numbers.sort((a: WinningNumber, b: WinningNumber) => 
      new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()
    );
  } catch (error) {
    console.error('Error getting winning numbers:', error);
    return [];
  }
};

export const deleteWinningNumber = async (numberId: string): Promise<void> => {
  try {
    const existingNumbers = await getWinningNumbers();
    const filteredNumbers = existingNumbers.filter(number => number.id !== numberId);
    await AsyncStorage.setItem(WINNING_NUMBERS_KEY, JSON.stringify(filteredNumbers));
  } catch (error) {
    console.error('Error deleting winning number:', error);
    throw error;
  }
};

// Result Comparison
export const compareTickets = async (): Promise<TicketResult[]> => {
  try {
    const tickets = await getTickets();
    const winningNumbers = await getWinningNumbers();
    
    const results: TicketResult[] = tickets.map(ticket => {
      // Find the winning number for the ticket's month
      const ticketMonth = new Date(ticket.purchaseDate).toISOString().substring(0, 7);
      const winningNumber = winningNumbers.find(w => w.month === ticketMonth);
      
      let isWinner = false;
      let matchCount = 0;
      
      if (winningNumber) {
        // Count matching digits
        const ticketDigits = ticket.numbers.split('');
        const winningDigits = winningNumber.numbers.split('');
        
        matchCount = ticketDigits.reduce((count, digit, index) => {
          return digit === winningDigits[index] ? count + 1 : count;
        }, 0);
        
        // Full match means winner
        isWinner = matchCount === 10;
      }
      
      return {
        id: ticket.id,
        numbers: ticket.numbers,
        isWinner,
        matchCount,
        purchaseDate: ticket.purchaseDate,
      };
    });
    
    // Sort by purchase date (newest first)
    return results.sort((a, b) => 
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );
  } catch (error) {
    console.error('Error comparing tickets:', error);
    return [];
  }
};

// Clear All Data
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TICKETS_KEY, WINNING_NUMBERS_KEY]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

// Seed initial data for demo purposes
export const seedDemoData = async (): Promise<void> => {
  try {
    const existingTickets = await getTickets();
    const existingNumbers = await getWinningNumbers();
    
    // Only seed if no data exists
    if (existingTickets.length === 0) {
      const demoTickets: Ticket[] = [
        {
          id: '1',
          numbers: '1234567890',
          purchaseDate: '2025-01-10T10:00:00.000Z',
          source: 'manual',
        },
        {
          id: '2',
          numbers: '9876543210',
          purchaseDate: '2025-01-12T14:30:00.000Z',
          source: 'sms',
        },
      ];
      
      await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(demoTickets));
    }
    
    if (existingNumbers.length === 0) {
      const demoWinningNumbers: WinningNumber[] = [
        {
          id: '1',
          numbers: '1234567890',
          drawDate: '2025-01-15T20:00:00.000Z',
          month: '2025-01',
        },
      ];
      
      await AsyncStorage.setItem(WINNING_NUMBERS_KEY, JSON.stringify(demoWinningNumbers));
    }
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};