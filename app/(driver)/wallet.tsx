import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  Wallet, 
  CreditCard, 
  Building2, 
  Smartphone,
  Plus,
  ChevronRight,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical
} from 'lucide-react-native';

type PaymentMethod = {
  id: string;
  type: 'card' | 'bank' | 'digital';
  name: string;
  details: string;
  icon: string;
  isDefault: boolean;
};

type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
};

export default function WalletScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'methods' | 'history'>('overview');

  const availableBalance = 20463.24;
  const pendingEarnings = 3847.50;
  const totalEarnings = 30607.27;

  const paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'card',
      name: 'Visa ending in 4242',
      details: 'Expires 12/25',
      icon: '💳',
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      name: 'Mastercard ending in 8888',
      details: 'Expires 08/26',
      icon: '💳',
      isDefault: false,
    },
    {
      id: '3',
      type: 'bank',
      name: 'Chase Bank',
      details: 'Account ****6789',
      icon: '🏦',
      isDefault: false,
    },
    {
      id: '4',
      type: 'bank',
      name: 'Bank of America',
      details: 'Account ****1234',
      icon: '🏦',
      isDefault: false,
    },
    {
      id: '5',
      type: 'digital',
      name: 'PayPal',
      details: 'driver@example.com',
      icon: '📱',
      isDefault: false,
    },
    {
      id: '6',
      type: 'digital',
      name: 'Venmo',
      details: '@driver-username',
      icon: '📱',
      isDefault: false,
    },
  ];

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'credit',
      description: 'Load Payment - Chicago to Dallas',
      amount: 2450.00,
      date: '2025-10-01',
      status: 'completed',
    },
    {
      id: '2',
      type: 'credit',
      description: 'Load Payment - New York to Miami',
      amount: 3200.00,
      date: '2025-09-28',
      status: 'completed',
    },
    {
      id: '3',
      type: 'debit',
      description: 'Withdrawal to Chase Bank',
      amount: 5000.00,
      date: '2025-09-25',
      status: 'completed',
    },
    {
      id: '4',
      type: 'credit',
      description: 'Load Payment - LA to Seattle',
      amount: 2800.00,
      date: '2025-09-24',
      status: 'completed',
    },
    {
      id: '5',
      type: 'credit',
      description: 'Bonus Payment',
      amount: 500.00,
      date: '2025-09-20',
      status: 'completed',
    },
  ];

  const handleAddPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'This feature will allow you to add new payment methods.');
  };

  const handleWithdraw = () => {
    Alert.alert('Withdraw Funds', 'Select a payment method to withdraw your earnings.');
  };

  const handleMethodPress = (method: PaymentMethod) => {
    Alert.alert(
      method.name,
      `Type: ${method.type}\n${method.details}\nDefault: ${method.isDefault ? 'Yes' : 'No'}`,
      [
        { text: 'Set as Default', onPress: () => console.log('Set as default') },
        { text: 'Remove', style: 'destructive', onPress: () => console.log('Remove') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderOverview = () => (
    <View>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Wallet size={24} color="#4CAF50" />
          <Text style={styles.balanceLabel}>Available Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.balanceSubtext}>Ready for withdrawal</Text>
        
        <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
          <ArrowUpRight size={20} color="#fff" />
          <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <TrendingUp size={20} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>${pendingEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.statLabel}>Pending Earnings</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <DollarSign size={20} color="#2196F3" />
          </View>
          <Text style={styles.statValue}>${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => setSelectedTab('history')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.slice(0, 3).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={[styles.transactionIcon, transaction.type === 'credit' ? styles.creditIcon : styles.debitIcon]}>
              {transaction.type === 'credit' ? (
                <ArrowDownLeft size={16} color="#4CAF50" />
              ) : (
                <ArrowUpRight size={16} color="#F44336" />
              )}
            </View>
            <View style={styles.transactionContent}>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.transactionAmount, transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount]}>
              {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPaymentMethod}>
          <Plus size={20} color="#4285F4" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.methodsContainer}>
        <Text style={styles.methodCategory}>Credit & Debit Cards</Text>
        {paymentMethods.filter(m => m.type === 'card').map((method) => (
          <TouchableOpacity key={method.id} style={styles.methodItem} onPress={() => handleMethodPress(method)}>
            <View style={styles.methodIconContainer}>
              <CreditCard size={20} color="#4285F4" />
            </View>
            <View style={styles.methodContent}>
              <View style={styles.methodHeader}>
                <Text style={styles.methodName}>{method.name}</Text>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.methodDetails}>{method.details}</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        <Text style={styles.methodCategory}>Bank Accounts</Text>
        {paymentMethods.filter(m => m.type === 'bank').map((method) => (
          <TouchableOpacity key={method.id} style={styles.methodItem} onPress={() => handleMethodPress(method)}>
            <View style={styles.methodIconContainer}>
              <Building2 size={20} color="#10B981" />
            </View>
            <View style={styles.methodContent}>
              <View style={styles.methodHeader}>
                <Text style={styles.methodName}>{method.name}</Text>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.methodDetails}>{method.details}</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        <Text style={styles.methodCategory}>Digital Wallets</Text>
        {paymentMethods.filter(m => m.type === 'digital').map((method) => (
          <TouchableOpacity key={method.id} style={styles.methodItem} onPress={() => handleMethodPress(method)}>
            <View style={styles.methodIconContainer}>
              <Smartphone size={20} color="#9C27B0" />
            </View>
            <View style={styles.methodContent}>
              <View style={styles.methodHeader}>
                <Text style={styles.methodName}>{method.name}</Text>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.methodDetails}>{method.details}</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Transaction History</Text>
      {recentTransactions.map((transaction) => (
        <View key={transaction.id} style={styles.transactionItem}>
          <View style={[styles.transactionIcon, transaction.type === 'credit' ? styles.creditIcon : styles.debitIcon]}>
            {transaction.type === 'credit' ? (
              <ArrowDownLeft size={16} color="#4CAF50" />
            ) : (
              <ArrowUpRight size={16} color="#F44336" />
            )}
          </View>
          <View style={styles.transactionContent}>
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
            <Text style={styles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[styles.transactionAmount, transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount]}>
              {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <View style={[styles.statusBadge, styles[`${transaction.status}Badge`]]}>
              <Text style={styles.statusText}>{transaction.status}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Wallet',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#1F2937',
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'methods' && styles.activeTab]}
            onPress={() => setSelectedTab('methods')}
          >
            <Text style={[styles.tabText, selectedTab === 'methods' && styles.activeTabText]}>Payment Methods</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
            onPress={() => setSelectedTab('history')}
          >
            <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'methods' && renderPaymentMethods()}
          {selectedTab === 'history' && renderHistory()}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4285F4',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  withdrawButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  withdrawButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4285F4',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F0FE',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#4285F4',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creditIcon: {
    backgroundColor: '#E8F5E9',
  },
  debitIcon: {
    backgroundColor: '#FFEBEE',
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  creditAmount: {
    color: '#4CAF50',
  },
  debitAmount: {
    color: '#F44336',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF8E1',
  },
  failedBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  methodsContainer: {
    gap: 8,
  },
  methodCategory: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodContent: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  methodDetails: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
});
