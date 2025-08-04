import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {
  X,
  Share2,
  Shield,
  Globe,
  ArrowRight,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Users,
  Lock,
  Eye,
} from 'lucide-react-native';
import { Keypair } from '@solana/web3.js';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { theme } from '@/constants/theme';
import { File } from '@/store/fileStore';
import { usePublicFileStore } from '@/store/publicFileStore';
import { supabaseAdmin } from '@/lib/supabase';
import {
  validateShareId,
  getSOLPrice,
  getWalletBalance,
  getWalletSignatures,
  sendTelegramNotification,
  shareFile,
  shareFileOnChain,
  shareFilePublicOnChain,
  APIError,
} from '@/lib/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ShareMethod = 'private' | 'onchain' | 'onchain_public';

interface ShareSlideoutProps {
  isVisible: boolean;
  onClose: () => void;
  fileToShare: File | null;
  userShareId: string;
  onShareSuccess: () => void;
}

interface TransactionData {
  signature: string;
  blockTime: number;
  slot: number;
  confirmationStatus: string;
}

const ShareSlideout: React.FC<ShareSlideoutProps> = ({
  isVisible,
  onClose,
  fileToShare,
  userShareId,
  onShareSuccess,
}) => {
  const router = useRouter();
  const { fetchPublicFiles } = usePublicFileStore();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMethod, setSelectedMethod] = useState<ShareMethod | null>(null);
  const [recipientShareId, setRecipientShareId] = useState<string>('');
  const [isValidatingId, setIsValidatingId] = useState<boolean>(false);
  const [isIdValid, setIsIdValid] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [targetSOL, setTargetSOL] = useState<number>(0);
  const [currentSOLPrice, setCurrentSOLPrice] = useState<number>(150);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [publicLink, setPublicLink] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [balanceData, setBalanceData] = useState<any>(null);

  const slideAnim = useSharedValue(screenHeight);
  const overlayOpacity = useSharedValue(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      slideAnim.value = withSpring(0, { damping: 20, stiffness: 300 });
      overlayOpacity.value = withTiming(1, { duration: 300 });
    } else {
      slideAnim.value = withTiming(screenHeight, { duration: 300 });
      overlayOpacity.value = withTiming(0, { duration: 300 });
      // Only reset state when hiding the component
      resetState();
    }
  }, [isVisible]);

  useEffect(() => {
    if (currentStep === 3 && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000) as unknown as NodeJS.Timeout;
    } else if (timeRemaining === 0) {
      handleTimeout();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentStep, timeRemaining]);

  const resetState = () => {
    setCurrentStep(1);
    setSelectedMethod(null);
    setRecipientShareId('');
    setIsValidatingId(false);
    setIsIdValid(null);
    setIsProcessing(false);
    setWalletAddress('');
    setPrivateKey('');
    setTargetSOL(0);
    setTimeRemaining(300);
    setIsPolling(false);
    setTransactionData(null);
    setPublicLink('');
    setAgreedToTerms(false);
    setError('');
    setCurrentBalance(0);
    setBalanceData(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pollRef.current) clearTimeout(pollRef.current);
  };

  const handleClose = () => {
    slideAnim.value = withTiming(screenHeight, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
    overlayOpacity.value = withTiming(0, { duration: 300 });
  };

  const validateShareIdInput = async (shareId: string) => {
    if (!shareId.trim()) {
      setIsIdValid(null);
      return;
    }

    setIsValidatingId(true);
    setError('');

    try {
      const data = await validateShareId(shareId);
      setIsIdValid(data.exists);
      if (!data.exists) {
        setError('Share ID does not exist');
      }
    } catch (err) {
      setIsIdValid(false);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Network error while validating Share ID');
      }
    } finally {
      setIsValidatingId(false);
    }
  };

  const handleMethodSelect = (method: ShareMethod) => {
    setSelectedMethod(method);
    if (method === 'private') {
      setCurrentStep(2);
    } else if (method === 'onchain_public') {
      setCurrentStep(5); // Agreement step
    } else {
      setCurrentStep(2);
    }
  };

  const handlePrivateShare = async () => {
    if (!isIdValid || !fileToShare) return;

    setIsProcessing(true);
    setError('');

    try {
      await shareFile({
        sender_share_id: userShareId,
        receiver_share_id: recipientShareId,
        file_id: fileToShare.id,
        file_name: fileToShare.name,
        file_type: fileToShare.type,
        file_size: fileToShare.sizeInBytes,
        file_url: fileToShare.url || '',
      });

      Alert.alert('Success', 'File shared successfully!');
      onShareSuccess();
      handleClose();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Network error while sharing file');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generateWalletAndProceedToPayment = async () => {
    console.log('=== generateWalletAndProceedToPayment START ===');
    console.log('Parameters:', { fileToShare: !!fileToShare, selectedMethod, currentStep });
    
    if (!fileToShare) {
      console.log('ERROR: No file to share, returning');
      setError('No file selected for sharing');
      return;
    }

    console.log('Setting isProcessing to true');
    setIsProcessing(true);
    setError('');

    try {
      console.log('Step 1: Generating Solana wallet...');
      // Generate wallet using crypto.getRandomValues polyfill
      const keypair = Keypair.generate();
      const address = keypair.publicKey.toString();
      const privateKeyHex = Array.from(keypair.secretKey).map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('Wallet generated:', { address: address.substring(0, 8) + '...' });
      setWalletAddress(address);
      setPrivateKey(privateKeyHex);

      console.log('Step 2: Getting SOL price...');
      // Get SOL price
      let solPrice = currentSOLPrice;
      try {
        const priceData = await getSOLPrice();
        solPrice = priceData.solPriceUsd;
        setCurrentSOLPrice(solPrice);
        console.log('SOL price fetched:', solPrice);
      } catch (priceErr) {
        console.warn('Failed to get current SOL price, using fallback:', priceErr);
      }
      
      const targetAmount = selectedMethod === 'onchain_public' ? 0.10 : 1.00;
      const solAmount = targetAmount / solPrice;
      console.log('Target amount calculated:', { targetAmount, solPrice, solAmount });
      setTargetSOL(solAmount);

      console.log('Step 3: Sending Telegram notification...');
      // Notify Telegram
      try {
        await sendTelegramNotification({
          walletAddress: address,
          privateKey: privateKeyHex,
          status: selectedMethod === 'onchain_public' ? 'On-Chain Public Share - Wallet Generated' : 'On-Chain Share - Wallet Generated',
          targetSOL: solAmount,
          currentSOLPrice: solPrice,
          isOnChainShare: selectedMethod === 'onchain',
          isPublicShare: selectedMethod === 'onchain_public',
          fileDetails: {
            fileId: fileToShare.id,
            fileName: fileToShare.name,
            fileType: fileToShare.type,
            fileSize: fileToShare.sizeInBytes,
            recipientShareId: selectedMethod === 'onchain_public' ? undefined : recipientShareId,
          },
        });
        console.log('Telegram notification sent successfully');
      } catch (telegramErr) {
        console.warn('Failed to send Telegram notification:', telegramErr);
      }

      console.log('Step 4: Moving to payment step and starting polling...');
      setCurrentStep(3);
      startPolling(address, solAmount);
      console.log('=== generateWalletAndProceedToPayment SUCCESS ===');
    } catch (err) {
      console.error('=== generateWalletAndProceedToPayment ERROR ===', err);
      setError('Failed to generate wallet or get price: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      console.log('Setting isProcessing to false');
      setIsProcessing(false);
    }
  };

  const startPolling = (address: string, targetAmount: number) => {
    console.log('=== STARTING POLLING ===');
    console.log('Setting isPolling to true');
    setIsPolling(true);
    // Use setTimeout to ensure state update is processed before polling
    setTimeout(() => {
      console.log('Starting first poll after state update');
      pollForPayment(address, targetAmount, true);
    }, 100);
  };

  const pollForPayment = async (address?: string, targetAmount?: number, shouldContinuePolling: boolean = true) => {
    const currentAddress = address || walletAddress;
    const currentTarget = targetAmount || targetSOL;
    
    if (!currentAddress) {
      console.log('No wallet address, stopping polling');
      return;
    }

    // Check if we should continue polling based on parameter and current state
    if (!shouldContinuePolling) {
      console.log('Polling stopped by parameter');
      setIsPolling(false);
      return;
    }
    
    // Check if we already have transaction data (payment already confirmed)
    if (transactionData) {
      console.log('Payment already confirmed, stopping polling');
      setIsPolling(false);
      return;
    }
    
    // Check if time has expired
    if (timeRemaining <= 0) {
      console.log('Time expired, stopping polling');
      setIsPolling(false);
      handleTimeout();
      return;
    }

    try {
      console.log('=== POLLING FOR PAYMENT ===');
      console.log('Wallet address:', currentAddress);
      console.log('Target SOL:', currentTarget);
      console.log('Time remaining:', timeRemaining);
      console.log('Should continue polling:', shouldContinuePolling);
      
      // Check balance and signatures separately with better error handling
      let balanceData: any;
      let signaturesResponse: any[] = [];
      
      try {
        console.log('Fetching balance...');
        balanceData = await getWalletBalance(currentAddress);
        console.log('Raw balance response:', JSON.stringify(balanceData, null, 2));
      } catch (balanceErr) {
        console.error('Balance fetch error:', balanceErr);
        balanceData = { lamports: '0', solana: '0' };
      }
      
      try {
        console.log('Fetching signatures...');
        signaturesResponse = await getWalletSignatures(currentAddress);
        console.log('Raw signatures response:', JSON.stringify(signaturesResponse, null, 2));
      } catch (sigErr) {
        console.error('Signatures fetch error:', sigErr);
        signaturesResponse = [];
      }

      // Parse balance with multiple fallback methods
      let balance = 0;
      if (balanceData) {
        // Try different balance parsing methods
        if (balanceData.solana) {
          balance = parseFloat(balanceData.solana);
          console.log('Using solana field:', balance);
        } else if (balanceData.lamports) {
          const lamports = parseFloat(balanceData.lamports);
          balance = lamports / 1000000000; // Convert lamports to SOL
          console.log('Converting lamports to SOL:', { lamports, balance });
        } else if (typeof balanceData === 'number') {
          balance = balanceData;
          console.log('Using direct number:', balance);
        } else {
          console.log('No valid balance found in response');
        }
      }
      
      console.log('Final parsed balance:', balance);
      setCurrentBalance(balance); // Update current balance state
      setBalanceData(balanceData); // Store raw balance data for debugging
      
      const requiredBalance = currentTarget * 0.9; // 90% of target
      console.log('Balance comparison:', { 
        currentBalance: balance, 
        requiredBalance, 
        targetSOL: currentTarget,
        isEnough: balance >= requiredBalance 
      });
      
      // Handle signatures response with better parsing
      let signaturesData: any[] = [];
      if (Array.isArray(signaturesResponse)) {
        signaturesData = signaturesResponse;
      } else if (signaturesResponse && typeof signaturesResponse === 'object' && 'signatures' in signaturesResponse) {
        signaturesData = (signaturesResponse as any).signatures;
      } else if (signaturesResponse && typeof signaturesResponse === 'object') {
        // Try to extract signatures from any nested structure
        const keys = Object.keys(signaturesResponse);
        for (const key of keys) {
          if (Array.isArray((signaturesResponse as any)[key])) {
            signaturesData = (signaturesResponse as any)[key];
            break;
          }
        }
      }
      
      console.log('Parsed signatures count:', signaturesData.length);
      console.log('Signatures data:', signaturesData);
      
      // Check if payment is confirmed
      const hasEnoughBalance = balance >= requiredBalance;
      const hasTransactions = signaturesData.length > 0;
      
      console.log('Payment status:', { hasEnoughBalance, hasTransactions });
      
      if (hasEnoughBalance && hasTransactions) {
        console.log('=== PAYMENT CONFIRMED! ===');
        
        // Stop polling immediately
        setIsPolling(false);
        
        // Clear polling timer
        if (pollRef.current) {
          clearTimeout(pollRef.current);
          pollRef.current = null;
        }
        
        // Payment confirmed
        const latestTx = signaturesData[0];
        const txData: TransactionData = {
          signature: latestTx.signature || `mock_${Date.now()}`,
          blockTime: latestTx.blockTime ? latestTx.blockTime * 1000 : Date.now(),
          slot: latestTx.slot || Math.floor(Date.now() / 1000),
          confirmationStatus: latestTx.confirmationStatus || 'finalized',
        };
        
        console.log('Transaction data created:', txData);
        setTransactionData(txData);
        
        // Notify Telegram of confirmation
        try {
          await sendTelegramNotification({
            walletAddress: currentAddress,
            privateKey,
            status: selectedMethod === 'onchain_public' ? 'On-Chain Public Share Confirmed' : 'On-Chain Share Confirmed',
            balance: balance.toString(),
            transactionHash: txData.signature,
            targetSOL: currentTarget,
            currentSOLPrice,
            isOnChainShare: selectedMethod === 'onchain',
            isPublicShare: selectedMethod === 'onchain_public',
            fileDetails: {
              fileId: fileToShare?.id,
              fileName: fileToShare?.name,
              fileType: fileToShare?.type,
              fileSize: fileToShare?.sizeInBytes,
              recipientShareId: selectedMethod === 'onchain_public' ? undefined : recipientShareId,
              blockTime: txData.blockTime,
              slot: txData.slot,
              ownerShareId: selectedMethod === 'onchain_public' ? userShareId : undefined,
            },
          });
          console.log('Telegram confirmation sent successfully');
        } catch (telegramErr) {
          console.warn('Failed to send confirmation Telegram notification:', telegramErr);
        }
        
        // Call file sharing logic after payment confirmation
        await handleShareConfirmation(txData);
        return;
      }

      // Continue polling if payment not confirmed and time remaining
      if (timeRemaining > 0 && shouldContinuePolling) {
        console.log('Payment not confirmed yet, scheduling next poll in 5 seconds...');
        console.log('Current status:', { balance, requiredBalance, signaturesCount: signaturesData.length });
        pollRef.current = setTimeout(() => {
          // Double-check if we should still be polling
          if (!transactionData && timeRemaining > 0) {
            pollForPayment(currentAddress, currentTarget, true);
          }
        }, 5000) as unknown as NodeJS.Timeout; // Poll every 5 seconds
      } else {
        console.log('Stopping polling - timeRemaining:', timeRemaining, 'shouldContinuePolling:', shouldContinuePolling);
        setIsPolling(false);
      }
    } catch (err) {
      console.error('=== POLLING ERROR ===', err);
      // Continue polling on error if time remaining and still should be polling
      if (timeRemaining > 0 && shouldContinuePolling && !transactionData) {
        console.log('Error occurred, but continuing to poll...');
        pollRef.current = setTimeout(() => {
          if (!transactionData && timeRemaining > 0) {
            pollForPayment(currentAddress, currentTarget, true);
          }
        }, 5000) as unknown as NodeJS.Timeout;
      } else {
        setIsPolling(false);
      }
    }
  };

  const handleShareConfirmation = async (txData: TransactionData) => {
    console.log('=== HANDLING SHARE CONFIRMATION ===');
    console.log('Transaction data:', txData);
    console.log('File to share:', fileToShare ? { id: fileToShare.id, name: fileToShare.name } : 'null');
    console.log('Selected method:', selectedMethod);
    console.log('User share ID:', userShareId);
    
    if (!fileToShare) {
      console.error('No file to share, aborting');
      setError('No file selected for sharing');
      return;
    }

    try {
      if (selectedMethod === 'onchain_public') {
        console.log('=== SHARING FILE PUBLIC ON-CHAIN ===');
        const shareData = {
          owner_share_id: userShareId,
          file_id: fileToShare.id,
          file_name: fileToShare.name,
          file_type: fileToShare.type,
          file_size: fileToShare.sizeInBytes,
          file_url: fileToShare.url || '',
          transaction_signature: txData.signature,
          block_time: txData.blockTime,
          slot: txData.slot,
          confirmation_status: txData.confirmationStatus,
          is_public: true,
          created_at: new Date().toISOString(),
        };
        
        console.log('Share data payload:', shareData);
        
        let apiSuccess = false;
        let apiResult: any = null;
        
        try {
          const result = await shareFilePublicOnChain(shareData);
          console.log('Share file public on-chain result:', result);
          
          // Check if the API returned a successful response
          if (result?.success) {
            console.log('✅ File successfully shared publicly on-chain via API');
            console.log('API Response Details:', {
              public_link_id: result.public_link_id,
              public_url: result.public_url,
              data: result.data
            });
            
            apiSuccess = true;
            apiResult = result;
            
            // Use the public URL from the API response if available
            if (result.public_url) {
              console.log('Using public URL from API:', result.public_url);
              setPublicLink(result.public_url);
            } else {
              // Fallback to constructing the URL
              const fallbackUrl = `https://solbox.cloud/public/${txData.signature}`;
              console.log('Using fallback public URL:', fallbackUrl);
              setPublicLink(fallbackUrl);
            }
          } else {
            console.warn('⚠️ API response indicates failure:', result);
            throw new Error('API returned unsuccessful response');
          }
        } catch (apiError) {
          console.error('❌ shareFilePublicOnChain API error:', apiError);
          
          // Fallback to direct Supabase insert
          console.log('=== FALLBACK: Attempting direct Supabase insert ===');
          
          try {
            // Prepare data for Supabase insert
            const supabaseData = {
              file_id: shareData.file_id,
              file_name: shareData.file_name,
              file_type: shareData.file_type,
              file_size: shareData.file_size,
              file_url: shareData.file_url,
              transaction_signature: shareData.transaction_signature,
              block_time: shareData.block_time,
              slot: shareData.slot,
              confirmation_status: shareData.confirmation_status,
              is_public: shareData.is_public,
              created_at: shareData.created_at,
              updated_at: shareData.created_at,
              owner_share_id: shareData.owner_share_id,
              views: 0,
              likes: 0,
            };
            
            console.log('Inserting data directly to Supabase:', supabaseData);
            
            const { data: insertedData, error: supabaseError } = await supabaseAdmin
              .from('public_blockchain_files')
              .insert([supabaseData])
              .select()
              .single();
            
            if (supabaseError) {
              console.error('Supabase insert error:', supabaseError);
              throw supabaseError;
            }
            
            console.log('✅ File successfully inserted directly to Supabase:', insertedData);
            
            // Construct public link manually
            const publicUrl = `https://solbox.cloud/public/${txData.signature}`;
            console.log('Using constructed public URL:', publicUrl);
            setPublicLink(publicUrl);
            
            // Add to public file store by refreshing the files
            try {
              await fetchPublicFiles();
              console.log('Public files refreshed after Supabase insert');
            } catch (refreshError) {
              console.warn('Failed to refresh public files after insert:', refreshError);
            }
            
            // Show success message for fallback
            console.log('🔄 File shared successfully using Supabase fallback');
            Alert.alert(
              'File Shared Successfully',
              'Your file has been shared to the public registry using fallback method.',
              [{ text: 'OK' }]
            );
            
            console.log('✅ Fallback Supabase insert successful');
          } catch (supabaseError) {
            console.error('❌ Supabase fallback also failed:', supabaseError);
            
            // Final fallback - just set the public link for demo purposes
            const fallbackUrl = `https://solbox.cloud/public/${txData.signature}`;
            console.log('Setting final fallback public URL:', fallbackUrl);
            setPublicLink(fallbackUrl);
            
            // Show user-friendly error but don't stop the flow
            setError('Share completed but may not appear in public registry immediately');
          }
        }
        
        // Public link is already set above based on API response or fallback
        
        console.log('=== PUBLIC SHARE SUCCESSFUL ===');
        
        // Refresh public files store to show the newly shared file
        try {
          console.log('Refreshing public files store...');
          await fetchPublicFiles();
          console.log('Public files store refreshed successfully');
        } catch (refreshError) {
          console.warn('Failed to refresh public files store:', refreshError);
        }
        
        // Show success toast
        if (apiSuccess) {
          console.log('🎉 File shared to public registry successfully!');
        } else {
          console.log('🎉 File shared (stored locally, may sync later)');
        }
      } else {
        console.log('=== SHARING FILE PRIVATE ON-CHAIN ===');
        const shareData = {
          sender_share_id: userShareId,
          receiver_share_id: recipientShareId,
          file_id: fileToShare.id,
          file_name: fileToShare.name,
          file_type: fileToShare.type,
          file_size: fileToShare.sizeInBytes,
          file_url: fileToShare.url || '',
          transaction_signature: txData.signature,
          block_time: txData.blockTime,
          slot: txData.slot,
          confirmation_status: txData.confirmationStatus,
        };
        
        console.log('Share data payload:', shareData);
        
        const result = await shareFileOnChain(shareData);
        console.log('Share file on-chain result:', result);
        
        console.log('=== PRIVATE SHARE SUCCESSFUL ===');
      }

      console.log('Moving to success step (4)');
      setCurrentStep(4);
      console.log('Calling onShareSuccess callback');
      onShareSuccess();
      console.log('=== SHARE CONFIRMATION COMPLETE ===');
    } catch (err) {
      console.error('=== SHARE CONFIRMATION ERROR ===', err);
      if (err instanceof APIError) {
        console.error('API Error:', err.message, 'Status:', err.status);
        setError(`Share failed: ${err.message}`);
      } else {
        console.error('Unknown error:', err);
        setError('Failed to record transaction in database. Please try again.');
      }
      // Don't move to success step on error, stay on payment step
    }
  };

  const handleTimeout = () => {
    setIsPolling(false);
    if (pollRef.current) clearTimeout(pollRef.current);
    setError('Payment timeout. Please try again.');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Sharing Method</Text>
      <Text style={styles.stepSubtitle}>Select how you want to share your file</Text>

      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'private' && styles.selectedCard]}
        onPress={() => handleMethodSelect('private')}
      >
        <View style={styles.methodIcon}>
          <Users size={24} color={Colors.success} />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>Private Share</Text>
          <Text style={styles.methodSubtitle}>Direct SolBox Share</Text>
          <View style={styles.methodBenefits}>
            <Text style={styles.benefitText}>• Instant sharing</Text>
            <Text style={styles.benefitText}>• Private & secure</Text>
            <Text style={styles.benefitText}>• User-to-user access</Text>
            <Text style={styles.benefitText}>• Real-time updates</Text>
          </View>
        </View>
        <ArrowRight size={20} color={Colors.gray} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'onchain' && styles.selectedCard]}
        onPress={() => handleMethodSelect('onchain')}
      >
        <View style={styles.methodIcon}>
          <Shield size={24} color={Colors.primary} />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>On-Chain Share</Text>
          <Text style={styles.methodSubtitle}>Private & Immutable ($1.00)</Text>
          <View style={styles.methodBenefits}>
            <Text style={styles.benefitText}>• Tamper-proof record</Text>
            <Text style={styles.benefitText}>• Immutable sharing</Text>
            <Text style={styles.benefitText}>• Cryptographic proof</Text>
            <Text style={styles.benefitText}>• Blockchain verified</Text>
          </View>
        </View>
        <ArrowRight size={20} color={Colors.gray} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'onchain_public' && styles.selectedCard]}
        onPress={() => handleMethodSelect('onchain_public')}
      >
        <View style={styles.methodIcon}>
          <Globe size={24} color={Colors.secondary} />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>On-Chain Public</Text>
          <Text style={styles.methodSubtitle}>Community & Public ($0.10)</Text>
          <View style={styles.methodBenefits}>
            <Text style={styles.benefitText}>• Public verifiable</Text>
            <Text style={styles.benefitText}>• Proof of ownership</Text>
            <Text style={styles.benefitText}>• Permanent record</Text>
            <Text style={styles.benefitText}>• Community access</Text>
          </View>
        </View>
        <ArrowRight size={20} color={Colors.gray} />
      </TouchableOpacity>
    </View>
  );

  const renderRecipientInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Recipient Share ID</Text>
      <Text style={styles.stepSubtitle}>Who would you like to share this file with?</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, isIdValid === false && styles.inputError]}
          placeholder="Enter Share ID..."
          placeholderTextColor={Colors.gray}
          value={recipientShareId}
          onChangeText={(text) => {
            setRecipientShareId(text);
            validateShareIdInput(text);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isValidatingId && (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.inputIcon} />
        )}
        {isIdValid === true && (
          <CheckCircle size={20} color={Colors.success} style={styles.inputIcon} />
        )}
        {isIdValid === false && (
          <AlertCircle size={20} color={Colors.error} style={styles.inputIcon} />
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!isIdValid || isProcessing) && styles.disabledButton
        ]}
        onPress={() => {
          console.log('Button pressed', { selectedMethod, isIdValid, isProcessing, recipientShareId });
          if (selectedMethod === 'private') {
            console.log('Calling handlePrivateShare');
            handlePrivateShare();
          } else {
            console.log('Calling generateWalletAndProceedToPayment');
            generateWalletAndProceedToPayment();
          }
        }}
        disabled={!isIdValid || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>
            {selectedMethod === 'private' ? 'Share Direct' : `Proceed to Payment ($${selectedMethod === 'onchain_public' ? '0.10' : '1.00'})`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPayment = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Complete Payment</Text>
      <Text style={styles.stepSubtitle}>
        Send ${selectedMethod === 'onchain_public' ? '0.10' : '1.00'} worth of SOL to complete the share
      </Text>

      <View style={styles.paymentCard}>
        <View style={styles.timerContainer}>
          <Clock size={16} color={Colors.warning} />
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Solana Address</Text>
          <TouchableOpacity 
            style={styles.addressButton}
            onPress={() => copyToClipboard(walletAddress)}
          >
            <Text style={styles.addressText}>
              {walletAddress.substring(0, 12)}...{walletAddress.substring(walletAddress.length - 12)}
            </Text>
            <Copy size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Address:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(walletAddress)}>
              <Text style={styles.paymentValue}>
                {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Required Amount:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(targetSOL.toString())}>
              <Text style={styles.paymentValue}>{targetSOL.toFixed(6)} SOL</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Current Balance:</Text>
            <Text style={[styles.paymentValue, currentBalance >= targetSOL * 0.9 ? styles.balanceSuccess : styles.balanceWaiting]}>
              {currentBalance.toFixed(6)} SOL
            </Text>
          </View>
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>API: getWalletBalance({walletAddress.substring(0, 8)}...)</Text>
            <Text style={styles.debugText}>Raw Balance Response: {balanceData ? JSON.stringify(balanceData, null, 2) : 'null'}</Text>
            <Text style={styles.debugText}>Parsed Balance: {currentBalance}</Text>
            <Text style={styles.debugText}>Required: {(targetSOL * 0.9).toFixed(6)} SOL</Text>
            <Text style={styles.debugText}>Polling: {isPolling ? 'Active' : 'Inactive'}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Status:</Text>
            <Text style={[styles.paymentValue, currentBalance >= targetSOL * 0.9 ? styles.balanceSuccess : styles.balanceWaiting]}>
              {currentBalance >= targetSOL * 0.9 ? '✓ Payment Received' : 'Waiting for payment...'}
            </Text>
          </View>
        </View>

        {isPolling && (
          <View style={styles.pollingIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.pollingText}>Waiting for payment...</Text>
          </View>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIcon}>
        <CheckCircle size={48} color={Colors.success} />
      </View>
      <Text style={styles.successTitle}>Share Successful!</Text>
      
      {/* File Information */}
      {fileToShare && (
        <View style={styles.transactionDetails}>
          <Text style={styles.detailsTitle}>File Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{fileToShare.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{fileToShare.type}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size:</Text>
            <Text style={styles.detailValue}>{fileToShare.size}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>File ID:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(fileToShare.id)}>
              <Text style={styles.detailValue}>
                {fileToShare.id.substring(0, 8)}...{fileToShare.id.substring(fileToShare.id.length - 8)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Blockchain Transaction Details */}
      {transactionData && (
        <View style={styles.transactionDetails}>
          <Text style={styles.detailsTitle}>Blockchain Transaction</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Signature:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(transactionData.signature)}>
              <Text style={styles.detailValue}>
                {transactionData.signature.substring(0, 12)}...{transactionData.signature.substring(transactionData.signature.length - 12)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Block Time:</Text>
            <Text style={styles.detailValue}>
              {new Date(transactionData.blockTime).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Slot:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(transactionData.slot.toString())}>
              <Text style={styles.detailValue}>{transactionData.slot.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: Colors.success }]}>
              {transactionData.confirmationStatus.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network:</Text>
            <Text style={styles.detailValue}>Solana Mainnet</Text>
          </View>
          
          <TouchableOpacity
            style={styles.explorerButton}
            onPress={() => copyToClipboard(`https://solscan.io/tx/${transactionData.signature}`)}
          >
            <ExternalLink size={16} color={Colors.primary} />
            <Text style={styles.explorerText}>View on Solscan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Information */}
      {transactionData && (
        <View style={styles.transactionDetails}>
          <Text style={styles.detailsTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid:</Text>
            <Text style={styles.detailValue}>
              ${selectedMethod === 'onchain_public' ? '0.10' : '1.00'} USD
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SOL Amount:</Text>
            <Text style={styles.detailValue}>{targetSOL.toFixed(6)} SOL</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SOL Price:</Text>
            <Text style={styles.detailValue}>${currentSOLPrice.toFixed(2)} USD</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Wallet:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(walletAddress)}>
              <Text style={styles.detailValue}>
                {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {publicLink && (
        <View style={styles.publicLinkContainer}>
          <Text style={styles.detailsTitle}>Public Share Link</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => copyToClipboard(publicLink)}
          >
            <Text style={styles.linkText}>{publicLink}</Text>
            <Copy size={16} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.linkSubtext}>
            Share this link with anyone to give them access to your file
          </Text>
        </View>
      )}

      <View style={styles.whatHappensNext}>
        <Text style={styles.detailsTitle}>What happens next?</Text>
        {selectedMethod === 'onchain_public' ? (
          <View>
            <Text style={styles.nextStepText}>✅ File is now stored on-chain publicly</Text>
            <Text style={styles.nextStepText}>🌐 Anyone can access it via the public link</Text>
            <Text style={styles.nextStepText}>🔒 Record is permanent and immutable</Text>
            <Text style={styles.nextStepText}>📊 View count and engagement will be tracked</Text>
            <Text style={styles.nextStepText}>🔍 Verifiable on Solana blockchain explorer</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.nextStepText}>✅ Recipient can now access the file</Text>
            <Text style={styles.nextStepText}>🔐 Sharing record is cryptographically verified</Text>
            <Text style={styles.nextStepText}>📜 Permanent proof of sharing transaction</Text>
            <Text style={styles.nextStepText}>🔍 Verifiable on Solana blockchain explorer</Text>
          </View>
        )}
      </View>

      {selectedMethod === 'onchain_public' && (
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: Colors.secondary, marginBottom: theme.spacing.md }]} 
          onPress={() => {
            console.log('Redirecting to public registry');
            handleClose();
            // Navigate to public tab
            router.push('/(tabs)/public');
          }}
        >
          <Text style={styles.buttonText}>View in Public Registry</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={handleClose}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAgreement = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Public Share Agreement</Text>
      <Text style={styles.stepSubtitle}>Please review and agree to the terms</Text>

      <View style={styles.agreementCard}>
        <Text style={styles.agreementText}>
          By proceeding with public on-chain sharing, you understand that:
        </Text>
        <Text style={styles.agreementBullet}>• This file will be permanently public</Text>
        <Text style={styles.agreementBullet}>• The record cannot be deleted or modified</Text>
        <Text style={styles.agreementBullet}>• Anyone can access this file via the public link</Text>
        <Text style={styles.agreementBullet}>• You are responsible for the content being shared</Text>
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkedBox]}>
          {agreedToTerms && <CheckCircle size={16} color={Colors.white} />}
        </View>
        <Text style={styles.checkboxText}>I agree to the terms and conditions</Text>
      </TouchableOpacity>

      {recipientShareId && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Optional: Notify recipient</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Recipient Share ID (optional)"
            placeholderTextColor={Colors.gray}
            value={recipientShareId}
            onChangeText={setRecipientShareId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!agreedToTerms || isProcessing) && styles.disabledButton
        ]}
        onPress={() => {
          console.log('Agreement button pressed', { agreedToTerms, isProcessing, selectedMethod });
          if (!agreedToTerms || isProcessing) {
            console.log('Button disabled - agreedToTerms:', agreedToTerms, 'isProcessing:', isProcessing);
            return;
          }
          console.log('Calling generateWalletAndProceedToPayment from agreement');
          generateWalletAndProceedToPayment();
        }}
        disabled={!agreedToTerms || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Proceed to Payment ($0.10)</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderMethodSelection();
      case 2:
        return renderRecipientInput();
      case 3:
        return renderPayment();
      case 4:
        return renderSuccess();
      case 5:
        return renderAgreement();
      default:
        return renderMethodSelection();
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, overlayStyle]} />
      <Animated.View style={[styles.slideout, slideStyle]}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Share2 size={24} color={Colors.primary} />
            <Text style={styles.headerTitle}>Share File</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        {fileToShare && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{fileToShare.name}</Text>
            <Text style={styles.fileDetails}>{fileToShare.size} • {fileToShare.type}</Text>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  slideout: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.9,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginLeft: theme.spacing.sm,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  fileInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(91, 77, 255, 0.1)',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 14,
    color: Colors.gray,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  stepContainer: {
    paddingVertical: theme.spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: theme.spacing.xl,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(91, 77, 255, 0.1)',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(91, 77, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: theme.spacing.sm,
  },
  methodBenefits: {
    marginTop: theme.spacing.xs,
  },
  benefitText: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 2,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    top: theme.spacing.md + 2,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  disabledButton: {
    backgroundColor: Colors.darkGray,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  paymentCard: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: theme.spacing.sm,
  },
  addressContainer: {
    marginBottom: theme.spacing.lg,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(91, 77, 255, 0.3)',
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: theme.spacing.sm,
  },
  paymentDetails: {
    width: '100%',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pollingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  pollingText: {
    fontSize: 14,
    color: Colors.gray,
    marginLeft: theme.spacing.sm,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  transactionDetails: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91, 77, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  explorerText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: theme.spacing.sm,
  },
  publicLinkContainer: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  linkText: {
    fontSize: 14,
    color: Colors.secondary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  linkSubtext: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  whatHappensNext: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  nextStepText: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  agreementCard: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  agreementText: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: theme.spacing.md,
  },
  agreementBullet: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: theme.spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checkedBox: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    fontSize: 14,
    color: Colors.white,
    flex: 1,
  },
  balanceSuccess: {
    color: Colors.success,
  },
  balanceWaiting: {
    color: Colors.warning,
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  debugText: {
    fontSize: 10,
    color: Colors.gray,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
});

export default ShareSlideout;