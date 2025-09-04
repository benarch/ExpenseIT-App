// ExpenseIT App - Main JavaScript File

class ExpenseApp {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.settings = JSON.parse(localStorage.getItem('settings')) || {
            defaultCurrency: 'USD',
            autoSuggestMerchants: true,
            autoCategorizeMerchants: true,
            theme: 'light',
            dateFormat: 'DD/MM/YYYY'
        };
        this.attendeeCounter = 0;
        this.attachedFiles = [];
        this.currentReceiptFile = null;
        this.cameraStream = null;
        this.currentFacingMode = 'environment'; // Start with rear camera
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.loadSettings();
        this.displayExpenses();
        this.setDefaultDate();
        this.setDefaultCurrency();
        this.updateCameraButtonForAndroid();
        this.setupCurrencyDropdown();
    }

    // Update camera button text for Android users
    updateCameraButtonForAndroid() {
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
            const cameraBtn = document.getElementById('cameraBtn');
            const buttonText = cameraBtn.querySelector('span:not(.icon)');
            if (buttonText) {
                buttonText.textContent = 'Camera/Upload';
            }
            cameraBtn.title = 'Try camera first, fallback to upload if needed';
        }
    }

    // Currency dropdown functionality
    setupCurrencyDropdown() {
        const currencySelect = document.getElementById('currency');
        const currencyOptions = document.getElementById('currencyOptions');
        
        // Populate the dropdown with options
        Array.from(currencySelect.options).forEach(option => {
            if (option.value) {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'currency-option';
                
                // Parse currency info
                const fullText = option.textContent;
                const parts = fullText.split(' - ');
                const symbolAndCode = parts[0]; // e.g., "$ USD"
                const currencyName = parts[1] || ''; // e.g., "US Dollar"
                const symbol = symbolAndCode.split(' ')[0]; // e.g., "$"
                const code = option.value; // e.g., "USD"
                
                // Create formatted option with icon and full name
                optionDiv.innerHTML = `
                    <span class="currency-symbol">${symbol}</span>
                    <span class="currency-info">
                        <span class="currency-code">${code}</span>
                        <span class="currency-name">${currencyName}</span>
                    </span>
                `;
                
                optionDiv.dataset.value = option.value;
                optionDiv.dataset.symbol = symbol;
                optionDiv.dataset.fullText = fullText;
                optionDiv.addEventListener('click', () => this.selectCurrency(option.value, fullText));
                currencyOptions.appendChild(optionDiv);
            }
        });
        
        this.allCurrencyOptions = Array.from(currencyOptions.children);
    }

    toggleCurrencyDropdown() {
        const dropdown = document.getElementById('currencyDropdown');
        const isActive = dropdown.classList.contains('active');
        
        if (isActive) {
            this.closeCurrencyDropdown();
        } else {
            dropdown.classList.add('active');
            document.getElementById('currencySearchInput').focus();
        }
    }

    closeCurrencyDropdown() {
        const dropdown = document.getElementById('currencyDropdown');
        dropdown.classList.remove('active');
        document.getElementById('currencySearchInput').value = '';
        this.filterCurrencies(''); // Reset filter
    }

    filterCurrencies(searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        this.allCurrencyOptions.forEach(option => {
            const text = option.textContent.toLowerCase();
            const matches = text.includes(searchLower);
            option.style.display = matches ? 'block' : 'none';
        });
    }

    selectCurrency(value, text) {
        const currencySelect = document.getElementById('currency');
        const currencySearch = document.getElementById('currencySearch');
        
        // Update the hidden select
        currencySelect.value = value;
        
        // Update the display
        const symbol = text.split(' ')[0]; // Extract symbol from text
        const code = value;
        currencySearch.value = `${symbol} ${code}`;
        currencySearch.placeholder = `${symbol} ${code}`;
        
        // Update selected state in dropdown
        this.allCurrencyOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.value === value) {
                option.classList.add('selected');
            }
        });
        
        this.closeCurrencyDropdown();
        
        // Trigger change event
        currencySelect.dispatchEvent(new Event('change'));
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab || e.target.closest('.nav-item').dataset.tab));
        });

        // Camera and upload buttons
        document.getElementById('cameraBtn').addEventListener('click', () => this.openCamera());
        document.getElementById('uploadBtn').addEventListener('click', () => this.openUpload());
        document.getElementById('manualBtn').addEventListener('click', () => this.showManualEntry());
        
        // Camera modal controls
        document.getElementById('closeCameraBtn').addEventListener('click', () => this.closeCamera());
        document.getElementById('cancelCameraBtn').addEventListener('click', () => this.closeCamera());
        document.getElementById('captureBtn').addEventListener('click', () => this.capturePhoto());
        document.getElementById('switchCameraBtn').addEventListener('click', () => this.switchCamera());
        
        // File inputs
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleImageCapture(e));
        document.getElementById('uploadInput').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('manualAttachInput').addEventListener('change', (e) => this.handleManualAttachment(e));
        
        // Retake button
        document.getElementById('retakeBtn').addEventListener('click', () => this.hideReceiptPreview());
        
        // Form submission
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.saveExpense(e));
        
        // Form controls
        document.getElementById('clearForm').addEventListener('click', () => this.clearForm());
        document.getElementById('addAttendeeBtn').addEventListener('click', () => this.addAttendee());
        document.getElementById('attachReceiptBtn').addEventListener('click', () => this.attachReceipt());
        document.getElementById('searchMerchant').addEventListener('click', () => this.searchMerchant());
        
        // Export and filter
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('filterCategory').addEventListener('change', (e) => this.filterExpenses(e.target.value));
        
        // Settings
        document.getElementById('defaultCurrency').addEventListener('change', (e) => this.updateSetting('defaultCurrency', e.target.value));
        document.getElementById('autoSuggestMerchants').addEventListener('change', (e) => this.updateSetting('autoSuggestMerchants', e.target.checked));
        document.getElementById('autoCategorizeMerchants').addEventListener('change', (e) => this.updateSetting('autoCategorizeMerchants', e.target.checked));
        document.getElementById('dateFormat').addEventListener('change', (e) => this.updateSetting('dateFormat', e.target.value));
        document.getElementById('clearAllData').addEventListener('click', () => this.clearAllData());
        document.getElementById('exportAllData').addEventListener('click', () => this.exportAllData());
        
        // Auto-categorization on merchant change
        document.getElementById('merchant').addEventListener('input', (e) => {
            this.autoCategorizeMerchant(e.target.value);
            if (this.settings.autoSuggestMerchants) {
                this.showMerchantSuggestions(e.target.value);
            }
        });
        
        // Setup merchant suggestions dropdown
        this.setupMerchantSuggestions();
        
        // Currency selection change to update display
        document.getElementById('currency').addEventListener('change', (e) => this.updateCurrencyDisplay(e.target));
        
        // Currency search functionality
        document.getElementById('currencySearch').addEventListener('click', () => this.toggleCurrencyDropdown());
        document.getElementById('currencySearchInput').addEventListener('input', (e) => this.filterCurrencies(e.target.value));
        
        // Close currency dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.currency-select-container')) {
                this.closeCurrencyDropdown();
            }
        });
        
        // Handle page unload to cleanup camera
        window.addEventListener('beforeunload', () => {
            this.closeCamera();
        });
    }

    // Theme Management
    setupTheme() {
        const savedTheme = this.settings.theme || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeIcon(newTheme);
        this.updateSetting('theme', newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Tab Management
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        
        // Add active class to selected nav item
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    // Camera and Image Handling
    async openCamera() {
        // Enhanced camera support check for Android
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        
        console.log('Opening camera - Android:', isAndroid, 'Mobile:', isMobile);
        console.log('Navigator mediaDevices:', !!navigator.mediaDevices);
        console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
        
        // Check for camera support with better Android detection
        if (!navigator.mediaDevices) {
            console.error('MediaDevices not supported');
            alert('Media devices not supported on this device. Please use the upload option instead.');
            if (isAndroid || isMobile) {
                document.getElementById('uploadInput').click();
            }
            return;
        }

        // For Android, try to access camera directly without pre-checking getUserMedia
        if (isAndroid) {
            console.log('Android detected - attempting direct camera access');
            try {
                await this.startCamera();
                document.getElementById('cameraModal').style.display = 'flex';
                return;
            } catch (error) {
                console.error('Android camera error:', error);
                this.handleCameraError(error, isAndroid, isMobile);
                return;
            }
        }

        // For non-Android devices, check getUserMedia availability
        if (!navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia not supported');
            alert('Camera access not supported on this device. Please use the upload option instead.');
            return;
        }

        try {
            await this.startCamera();
            document.getElementById('cameraModal').style.display = 'flex';
        } catch (error) {
            console.error('Camera error:', error);
            this.handleCameraError(error, isAndroid, isMobile);
        }
    }

    handleCameraError(error, isAndroid, isMobile) {
        let errorMessage = 'Unable to access camera: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Camera permission denied. ';
            if (isAndroid) {
                errorMessage += 'On Android:\n1. Tap "Allow" when prompted for camera permission\n2. Check browser settings for camera access\n3. Try refreshing the page';
            } else {
                errorMessage += 'Please allow camera access when prompted.';
            }
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Camera is being used by another app. ';
            if (isAndroid) {
                errorMessage += 'Please close other camera apps and try again.';
            }
        } else if (error.name === 'NotSupportedError') {
            errorMessage += 'Camera is not supported in this browser. ';
            if (isAndroid) {
                errorMessage += 'Try using Chrome or Firefox on Android.';
            }
        } else {
            errorMessage += 'Please try using the upload option instead.';
        }
        
        alert(errorMessage);
        
        // Automatically trigger file upload as fallback for mobile users
        if (isAndroid || isMobile) {
            setTimeout(() => {
                document.getElementById('uploadInput').click();
            }, 1000);
        }
    }

    async startCamera() {
        try {
            // Stop existing stream if any
            if (this.cameraStream) {
                this.cameraStream.getTracks().forEach(track => track.stop());
            }

            const isAndroid = /Android/i.test(navigator.userAgent);
            
            // Try different constraint strategies for better Android compatibility
            const constraintOptions = [
                // First try: Android-optimized constraints
                {
                    video: {
                        facingMode: this.currentFacingMode,
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 }
                    }
                },
                // Second try: More basic constraints
                {
                    video: {
                        facingMode: this.currentFacingMode,
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                },
                // Third try: Very basic constraints
                {
                    video: {
                        facingMode: this.currentFacingMode
                    }
                },
                // Final try: Just video without facingMode (for devices that don't support it)
                {
                    video: true
                }
            ];

            let cameraStream = null;
            let lastError = null;

            // Try each constraint option until one works
            for (const constraints of constraintOptions) {
                try {
                    console.log('Trying camera constraints:', constraints);
                    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
                    this.cameraStream = cameraStream;
                    break;
                } catch (error) {
                    console.warn('Camera constraint failed:', constraints, error);
                    lastError = error;
                    continue;
                }
            }

            if (!cameraStream) {
                throw lastError || new Error('All camera constraint options failed');
            }

            const video = document.getElementById('cameraVideo');
            video.srcObject = this.cameraStream;
            
            return new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    resolve();
                };
            });
        } catch (error) {
            console.error('Error starting camera:', error);
            throw error;
        }
    }

    async switchCamera() {
        try {
            this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
            await this.startCamera();
        } catch (error) {
            console.error('Error switching camera:', error);
            // Revert back if switching fails
            this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
            alert('Unable to switch camera. Using current camera.');
        }
    }

    closeCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        document.getElementById('cameraModal').style.display = 'none';
    }

    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (blob) {
                // Create a file-like object from the blob
                const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
                
                // Close camera and process the image
                this.closeCamera();
                this.processImage(file, true);
            }
        }, 'image/jpeg', 0.9);
    }

    openUpload() {
        document.getElementById('uploadInput').click();
    }

    attachReceipt() {
        document.getElementById('manualAttachInput').click();
    }

    showManualEntry() {
        this.hideReceiptPreview();
        document.getElementById('expenseForm').scrollIntoView({ behavior: 'smooth' });
    }

    handleImageCapture(event) {
        this.processImage(event.target.files[0], true);
    }

    handleImageUpload(event) {
        this.processImage(event.target.files[0], true);
    }

    handleManualAttachment(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            this.addAttachmentToList(file);
        });
        this.updateAttachmentsDisplay();
        // Clear the input
        event.target.value = '';
    }

    // Image preprocessing for better OCR accuracy
    async preprocessImageForOCR(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate optimal size (maintain aspect ratio, max 2000px width)
                const maxWidth = 2000;
                const scale = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                // Draw image with enhanced contrast and sharpening
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Apply image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Get image data for processing
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Apply contrast enhancement and binarization
                for (let i = 0; i < data.length; i += 4) {
                    // Convert to grayscale
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    
                    // Apply contrast enhancement
                    const enhanced = Math.pow(gray / 255, 0.7) * 255;
                    
                    // Apply threshold for better text recognition
                    const threshold = enhanced > 128 ? 255 : 0;
                    
                    data[i] = threshold;     // R
                    data[i + 1] = threshold; // G
                    data[i + 2] = threshold; // B
                    // Alpha channel stays the same
                }
                
                // Put processed image data back
                ctx.putImageData(imageData, 0, 0);
                
                // Convert canvas to blob
                canvas.toBlob(resolve, 'image/png', 1.0);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Post-process OCR text for better accuracy
    postprocessOCRText(text) {
        if (!text) return '';
        
        // Fix common OCR errors
        let processed = text
            // Fix common character substitutions
            .replace(/[0O]/g, match => {
                // Context-based 0/O correction
                const beforeAfter = text.substring(Math.max(0, text.indexOf(match) - 3), text.indexOf(match) + 4);
                if (/\d/.test(beforeAfter)) return '0';
                if (/[A-Za-z]/.test(beforeAfter)) return 'O';
                return match;
            })
            .replace(/[1Il|]/g, match => {
                // Context-based 1/I/l correction
                const beforeAfter = text.substring(Math.max(0, text.indexOf(match) - 3), text.indexOf(match) + 4);
                if (/\d/.test(beforeAfter)) return '1';
                return match;
            })
            // Fix common currency symbols
            .replace(/\b5(?=\d+\.?\d*)/g, '$')  // 5 mistaken for $
            .replace(/\bS(?=\d+\.?\d*)/g, '$')  // S mistaken for $
            .replace(/\bE(?=\d+\.?\d*)/g, '€')  // E mistaken for €
            // Fix decimal separators
            .replace(/(\d)\s+(\d{2})\b/g, '$1.$2')  // "10 50" -> "10.50"
            .replace(/(\d),(\d{3})\b/g, '$1$2')     // Remove thousands separator
            // Clean up extra spaces
            .replace(/\s+/g, ' ')
            .trim();
            
        return processed;
    }

    // Alternative OCR processing with different settings
    async tryAlternativeOCR(file) {
        try {
            const result = await Tesseract.recognize(file, 'eng', {
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
                tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT,
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-$/€£¥₪ '
            });
            return this.postprocessOCRText(result.data.text);
        } catch (error) {
            console.error('Alternative OCR failed:', error);
            return null;
        }
    }

    async processImage(file, showAsAttachment = false) {
        if (!file) return;

        this.currentReceiptFile = file;
        
        if (showAsAttachment) {
            this.showReceiptPreview(file);
            // Also add to attachments list
            this.addAttachmentToList(file);
            this.updateAttachmentsDisplay();
        }

        this.showLoading('Processing receipt with OCR...');

        try {
            // Pre-process the image for better OCR accuracy
            const preprocessedImage = await this.preprocessImageForOCR(file);
            
            // Perform OCR on the preprocessed image with optimized settings
            const result = await Tesseract.recognize(preprocessedImage, 'eng+heb+fra+spa+deu', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        this.showLoading(`Processing receipt... ${progress}%`);
                    }
                },
                // Enhanced Tesseract configuration for receipt recognition
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
                preserve_interword_spaces: '1',
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-$/€£¥₪*()&% ',
                // Improve number recognition for amounts
                classify_enable_learning: '1',
                textord_really_old_xheight: '1',
                textord_min_xheight: '7',
                // Better line detection
                textord_tabfind_find_tables: '1',
                // Improve word recognition
                segment_penalty_dict_frequent_word: '1',
                segment_penalty_dict_case_ok: '1',
                // Character confidence
                tessedit_reject_bad_qual_wds: '1',
                tessedit_preserve_blk_wd_gaps: '1',
                tessedit_preserve_row_wd_gaps: '1'
            });

            let extractedText = result.data.text;
            console.log('OCR Confidence:', result.data.confidence);
            console.log('Raw extracted text:', extractedText);
            
            // Post-process OCR text for better accuracy
            extractedText = this.postprocessOCRText(extractedText);
            console.log('Processed text:', extractedText);
            
            if (extractedText.trim().length < 10) {
                // Try alternative processing if first attempt failed
                const alternativeResult = await this.tryAlternativeOCR(file);
                if (alternativeResult && alternativeResult.length > 10) {
                    extractedText = alternativeResult;
                } else {
                    this.hideLoading();
                    this.showToast('⚠️ Could not extract much text from image. Please try a clearer image or enter data manually.', 'warning');
                    return;
                }
            }

            // Extract information from the text
            const extractedData = this.extractReceiptData(extractedText);
            
            // Check if we extracted any meaningful data
            const extractedFieldsCount = Object.values(extractedData).filter(value => 
                value && value.toString().trim() !== ''
            ).length;
            
            if (extractedFieldsCount === 0) {
                this.hideLoading();
                this.showToast('⚠️ Could not extract expense data from receipt. Please enter data manually.', 'warning');
                return;
            }
            
            // Populate form with extracted data
            this.populateForm(extractedData);
            
            this.hideLoading();
            
        } catch (error) {
            console.error('OCR Error:', error);
            this.hideLoading();
            this.showToast('❌ Failed to process receipt. Please try again or enter data manually.', 'error');
        }
    }

    showReceiptPreview(file) {
        const preview = document.getElementById('receiptPreview');
        const img = document.getElementById('receiptImage');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    hideReceiptPreview() {
        document.getElementById('receiptPreview').style.display = 'none';
        document.getElementById('fileInput').value = '';
        document.getElementById('uploadInput').value = '';
    }

    // Attachment Management
    addAttachmentToList(file) {
        const attachment = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            url: URL.createObjectURL(file)
        };
        this.attachedFiles.push(attachment);
    }

    updateAttachmentsDisplay() {
        const attachedFilesDiv = document.getElementById('attachedFiles');
        const attachmentsGrid = document.getElementById('attachmentsGrid');
        
        if (this.attachedFiles.length === 0) {
            attachedFilesDiv.style.display = 'none';
            return;
        }
        
        attachedFilesDiv.style.display = 'block';
        attachmentsGrid.innerHTML = this.attachedFiles.map(attachment => `
            <div class="attachment-item" data-id="${attachment.id}">
                <img src="${attachment.url}" alt="${attachment.name}" onclick="expenseApp.viewAttachment('${attachment.id}')">
                <button class="attachment-remove" onclick="expenseApp.removeAttachment('${attachment.id}')" title="Remove attachment">×</button>
            </div>
        `).join('');
    }

    removeAttachment(id) {
        const attachment = this.attachedFiles.find(a => a.id == id);
        if (attachment) {
            URL.revokeObjectURL(attachment.url);
        }
        this.attachedFiles = this.attachedFiles.filter(a => a.id != id);
        this.updateAttachmentsDisplay();
    }

    viewAttachment(id) {
        const attachment = this.attachedFiles.find(a => a.id == id);
        if (attachment) {
            window.open(attachment.url, '_blank');
        }
    }

    // OCR Data Extraction
    extractReceiptData(text) {
        const data = {};
        console.log('OCR Text:', text); // Debug log
        
        // Clean and split text into lines
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const lowerText = text.toLowerCase();
        
        // Extract merchant (enhanced business name detection)
        if (lines.length > 0) {
            let merchantCandidates = [];
            
            for (let i = 0; i < Math.min(10, lines.length); i++) {
                const line = lines[i];
                const score = this.scoreMerchantCandidate(line, i);
                
                if (score > 0) {
                    merchantCandidates.push({
                        text: line,
                        score: score,
                        position: i
                    });
                }
            }
            
            // Sort by score and pick the best candidate
            merchantCandidates.sort((a, b) => b.score - a.score);
            
            if (merchantCandidates.length > 0) {
                data.merchant = merchantCandidates[0].text;
            } else if (lines.length > 0) {
                // Fallback to first non-empty line
                data.merchant = lines[0];
            }
        }

        // Extract amount - enhanced patterns with better accuracy
        const amountPatterns = [
            // Total/Amount with currency symbols
            /(?:total|amount|sum|grand\s*total)[:\s]*[\$€£¥₪]?\s*(\d+(?:[.,]\d{2,3})?)/gi,
            // Currency symbols followed by numbers
            /[\$€£¥₪]\s*(\d+(?:[.,]\d{1,3})?)/g,
            // Numbers followed by currency symbols
            /(\d+(?:[.,]\d{1,3})?)\s*[\$€£¥₪]/g,
            // Decimal amounts (likely prices)
            /\b(\d{1,6}[.,]\d{2})\b/g,
            // Total lines with numbers
            /(?:^|\n)\s*(?:total|amount|sum)[:\s]*(\d+(?:[.,]\d{2,3})?)/gim,
            // Price patterns with context
            /(?:price|cost|charge)[:\s]*[\$€£¥₪]?\s*(\d+(?:[.,]\d{2,3})?)/gi,
            // Standalone currency amounts
            /(?:^|\s)([\$€£¥₪]\d+(?:[.,]\d{2,3})?)/gm,
            // Invoice/bill totals
            /(?:invoice|bill)\s*(?:total|amount)[:\s]*[\$€£¥₪]?\s*(\d+(?:[.,]\d{2,3})?)/gi
        ];
        
        let bestAmount = null;
        let highestAmount = 0;
        let amountCandidates = [];
        
        for (const pattern of amountPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const amountStr = (match[1] || match[0]).replace(/[\$€£¥₪]/g, '').trim();
                const cleanAmount = amountStr.replace(/,(?=\d{3})/g, '').replace(',', '.');
                const numAmount = parseFloat(cleanAmount);
                
                if (!isNaN(numAmount) && numAmount > 0.01 && numAmount < 999999) {
                    amountCandidates.push({
                        amount: cleanAmount,
                        value: numAmount,
                        context: text.substring(Math.max(0, match.index - 20), match.index + 20).toLowerCase(),
                        priority: this.getAmountPriority(match[0], text.substring(Math.max(0, match.index - 20), match.index + 20))
                    });
                }
            }
        }
        
        // Sort by priority and value to find the most likely total
        amountCandidates.sort((a, b) => b.priority - a.priority || b.value - a.value);
        
        if (amountCandidates.length > 0) {
            bestAmount = amountCandidates[0].amount;
        }
        
        if (bestAmount) {
            data.amount = bestAmount;
        }

        // Detect currency - improved detection
        const currencyMap = {
            '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₪': 'ILS',
            'usd': 'USD', 'eur': 'EUR', 'gbp': 'GBP', 'jpy': 'JPY', 'ils': 'ILS'
        };
        
        for (const [symbol, code] of Object.entries(currencyMap)) {
            if (lowerText.includes(symbol)) {
                data.currency = code;
                break;
            }
        }
        
        if (!data.currency) {
            if (this.isHebrewText(text)) data.currency = 'ILS';
            else data.currency = this.settings.defaultCurrency;
        }

        // Extract date - improved patterns
        const datePatterns = [
            /date[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
            /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
            /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/gi,
            /(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g
        ];
        
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                const parsedDate = this.parseDate(match[1] || match[0]);
                if (parsedDate) {
                    data.date = parsedDate;
                    break;
                }
            }
        }

        // Extract VAT/Tax information
        const vatPatterns = [
            /vat[:\s]*(\d+(?:\.\d{1,2})?%?)/gi,
            /tax[:\s]*(\d+(?:\.\d{1,2})?%?)/gi,
            /(\d+(?:\.\d{1,2})?%)\s*vat/gi
        ];
        
        for (const pattern of vatPatterns) {
            const match = text.match(pattern);
            if (match) {
                const vatStr = match[1].replace('%', '');
                const vatNum = parseFloat(vatStr);
                if (!isNaN(vatNum) && vatNum >= 0 && vatNum <= 50) {
                    data.vatRate = vatNum.toString();
                    break;
                }
            }
        }

        // Extract payment method - Enhanced with card number detection
        const paymentKeywords = {
            'cash': 'cash',
            'credit': 'credit-card',
            'debit': 'debit-card',
            'card': 'credit-card',
            'visa': 'credit-card',
            'mastercard': 'credit-card',
            'master card': 'credit-card',
            'amex': 'credit-card',
            'american express': 'credit-card',
            'discover': 'credit-card',
            'paypal': 'paypal',
            'check': 'check',
            'cheque': 'check',
            'transfer': 'bank-transfer',
            'wire': 'bank-transfer',
            'contactless': 'credit-card',
            'chip': 'credit-card',
            'tap': 'credit-card'
        };
        
        // Check for credit card patterns (4 digits, last 4 digits of card, etc.)
        const cardPatterns = [
            /(?:card|visa|mastercard|amex|discover).*?(\d{4})/gi,
            /(?:ending|last|xxxx).*?(\d{4})/gi,
            /\*+(\d{4})/g,
            /x{4,}(\d{4})/gi,
            /(\d{4})\s*$(?=.*(?:card|visa|mastercard|amex))/gim
        ];
        
        let detectedCardNumber = null;
        let detectedCardType = 'credit-card';
        
        // First, try to detect card numbers and types
        for (const pattern of cardPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                detectedCardNumber = match[1];
                // Determine card type by first digit if we have more context
                const contextBefore = text.substring(Math.max(0, match.index - 50), match.index).toLowerCase();
                
                if (contextBefore.includes('visa')) {
                    detectedCardType = 'credit-card';
                    data.paymentMethod = 'credit-card';
                } else if (contextBefore.includes('mastercard') || contextBefore.includes('master card')) {
                    detectedCardType = 'credit-card';
                    data.paymentMethod = 'credit-card';
                } else if (contextBefore.includes('amex') || contextBefore.includes('american express')) {
                    detectedCardType = 'credit-card';
                    data.paymentMethod = 'credit-card';
                } else if (contextBefore.includes('discover')) {
                    detectedCardType = 'credit-card';
                    data.paymentMethod = 'credit-card';
                } else if (contextBefore.includes('debit')) {
                    detectedCardType = 'debit-card';
                    data.paymentMethod = 'debit-card';
                } else {
                    data.paymentMethod = 'credit-card'; // Default for card numbers
                }
                break;
            }
            if (detectedCardNumber) break;
        }
        
        // If no card number detected, check for payment keywords
        if (!data.paymentMethod) {
            for (const [keyword, method] of Object.entries(paymentKeywords)) {
                if (lowerText.includes(keyword)) {
                    data.paymentMethod = method;
                    break;
                }
            }
        }
        
        // Store card info if detected
        if (detectedCardNumber) {
            data.cardLastFour = detectedCardNumber;
        }

        // Extract project/reference numbers
        const projectPatterns = [
            /project[:\s#]*([a-z0-9\-_]+)/gi,
            /ref[:\s#]*([a-z0-9\-_]+)/gi,
            /order[:\s#]*([a-z0-9\-_]+)/gi,
            /#([a-z0-9\-_]+)/gi
        ];
        
        for (const pattern of projectPatterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[1].length > 2) {
                data.project = match[1];
                break;
            }
        }

        // Extract notes/description from longer lines
        const potentialNotes = lines.filter(line => 
            line.length > 20 && 
            !line.match(/^\d/) && // Not starting with number
            !line.toLowerCase().includes('total') &&
            !line.toLowerCase().includes('amount') &&
            !line.toLowerCase().includes('date') &&
            line !== data.merchant
        );
        
        if (potentialNotes.length > 0) {
            data.notes = potentialNotes[0];
        }

        // Auto-categorize based on merchant name
        if (data.merchant && this.settings.autoCategorizeMerchants) {
            data.category = this.categorizeMerchant(data.merchant);
        }

        console.log('Extracted data:', data); // Debug log
        return data;
    }

    // Helper function to prioritize amount candidates
    getAmountPriority(matchText, context) {
        let priority = 0;
        const lowerMatch = matchText.toLowerCase();
        const lowerContext = context.toLowerCase();
        
        // High priority keywords
        if (lowerContext.includes('total')) priority += 10;
        if (lowerContext.includes('amount')) priority += 8;
        if (lowerContext.includes('sum')) priority += 7;
        if (lowerContext.includes('grand')) priority += 9;
        if (lowerContext.includes('subtotal')) priority += 5;
        
        // Medium priority
        if (lowerContext.includes('price')) priority += 4;
        if (lowerContext.includes('cost')) priority += 4;
        if (lowerContext.includes('charge')) priority += 4;
        
        // Bonus for currency symbols
        if (/[\$€£¥₪]/.test(matchText)) priority += 3;
        
        // Penalty for likely non-total amounts
        if (lowerContext.includes('tax')) priority -= 2;
        if (lowerContext.includes('tip')) priority -= 2;
        if (lowerContext.includes('change')) priority -= 5;
        if (lowerContext.includes('discount')) priority -= 3;
        
        return priority;
    }

    // Score merchant name candidates for better accuracy
    scoreMerchantCandidate(line, position) {
        let score = 0;
        const lowerLine = line.toLowerCase();
        
        // Length scoring (business names are usually 3-50 characters)
        if (line.length >= 3 && line.length <= 50) {
            score += Math.min(line.length / 10, 5);
        } else {
            return 0; // Too short or too long
        }
        
        // Position scoring (business names usually appear early)
        if (position === 0) score += 10;
        else if (position <= 2) score += 7;
        else if (position <= 5) score += 3;
        
        // Content scoring
        // Positive indicators
        if (/^[A-Z]/.test(line)) score += 3; // Starts with capital
        if (/[A-Z]{2,}/.test(line)) score += 2; // Has uppercase letters
        if (/\b(restaurant|cafe|store|shop|inc|ltd|llc|corp)\b/i.test(line)) score += 5;
        if (/&/.test(line)) score += 2; // Business names often have &
        
        // Negative indicators
        if (/^(receipt|invoice|bill|order|transaction|payment|total|subtotal|tax|date|time|address|phone|tel|www|http)/i.test(line)) return 0;
        if (/^\d+$/.test(line)) return 0; // Pure numbers
        if (/^[\d\s\-\(\)]+$/.test(line)) return 0; // Only numbers and formatting
        if (lowerLine.includes('customer copy')) return 0;
        if (lowerLine.includes('merchant copy')) return 0;
        if (/\d{2}\/\d{2}\/\d{4}/.test(line)) return 0; // Date format
        if (/\d{1,2}:\d{2}/.test(line)) return 0; // Time format
        if (line.includes('@')) score -= 3; // Email addresses
        if (line.includes('.com')) score -= 3; // Website URLs
        
        return Math.max(0, score);
    }

    isHebrewText(text) {
        const hebrewRegex = /[\u0590-\u05FF]/;
        return hebrewRegex.test(text);
    }

    parseDate(dateStr) {
        try {
            let parsedDate = null;
            
            // Try different date parsing approaches
            const cleanDateStr = dateStr.replace(/[^\d\/\-\.]/g, '').trim();
            
            // Check for different formats based on separators and length
            if (cleanDateStr.includes('/')) {
                const parts = cleanDateStr.split('/');
                if (parts.length === 3) {
                    // Determine format based on user preference and content
                    const [p1, p2, p3] = parts.map(p => parseInt(p));
                    
                    // Try to parse based on user's preferred format
                    if (this.settings.dateFormat === 'DD/MM/YYYY') {
                        // DD/MM/YYYY format
                        if (p3 > 31) { // Third part is year
                            parsedDate = new Date(p3, p2 - 1, p1);
                        } else if (p1 > 31) { // First part might be year
                            parsedDate = new Date(p1, p2 - 1, p3);
                        }
                    } else if (this.settings.dateFormat === 'MM/DD/YYYY') {
                        // MM/DD/YYYY format
                        if (p3 > 31) { // Third part is year
                            parsedDate = new Date(p3, p1 - 1, p2);
                        } else if (p1 > 31) { // First part might be year
                            parsedDate = new Date(p1, p3 - 1, p2);
                        }
                    } else if (this.settings.dateFormat === 'YYYY/MM/DD') {
                        // YYYY/MM/DD format
                        if (p1 > 31) { // First part is year
                            parsedDate = new Date(p1, p2 - 1, p3);
                        } else if (p3 > 31) { // Third part might be year
                            parsedDate = new Date(p3, p1 - 1, p2);
                        }
                    }
                }
            } else if (cleanDateStr.includes('-') || cleanDateStr.includes('.')) {
                // Try standard date parsing for other formats
                parsedDate = new Date(dateStr);
            }
            
            // Fallback to standard parsing
            if (!parsedDate || isNaN(parsedDate.getTime())) {
                parsedDate = new Date(dateStr);
            }
            
            // Validate the parsed date
            if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1990 && parsedDate.getFullYear() < 2100) {
                return parsedDate.toISOString().split('T')[0];
            }
        } catch (e) {
            console.error('Date parsing error:', e);
        }
        return '';
    }
    
    // Format date according to user preference for display
    formatDateForDisplay(dateStr) {
        if (!dateStr) return '';
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            switch (this.settings.dateFormat) {
                case 'MM/DD/YYYY':
                    return `${month}/${day}/${year}`;
                case 'YYYY/MM/DD':
                    return `${year}/${month}/${day}`;
                case 'DD/MM/YYYY':
                default:
                    return `${day}/${month}/${year}`;
            }
        } catch (e) {
            return dateStr;
        }
    }

    // Merchant Categorization
    categorizeMerchant(merchantName) {
        const merchant = merchantName.toLowerCase();
        
        // Restaurant keywords
        if (merchant.includes('restaurant') || merchant.includes('cafe') || merchant.includes('bistro') || 
            merchant.includes('grill') || merchant.includes('diner') || merchant.includes('pizza') ||
            merchant.includes('burger') || merchant.includes('sushi') || merchant.includes('bar')) {
            return 'restaurant';
        }
        
        // Hotel keywords
        if (merchant.includes('hotel') || merchant.includes('inn') || merchant.includes('resort') ||
            merchant.includes('lodge') || merchant.includes('motel')) {
            return 'hotel-lodging';
        }
        
        // Gas/Car keywords
        if (merchant.includes('gas') || merchant.includes('fuel') || merchant.includes('station') ||
            merchant.includes('shell') || merchant.includes('bp') || merchant.includes('exxon') ||
            merchant.includes('parking') || merchant.includes('garage')) {
            return 'car-related';
        }
        
        // Grocery keywords
        if (merchant.includes('market') || merchant.includes('grocery') || merchant.includes('supermarket') ||
            merchant.includes('walmart') || merchant.includes('target') || merchant.includes('costco')) {
            return 'groceries';
        }
        
        // Transportation
        if (merchant.includes('taxi') || merchant.includes('uber') || merchant.includes('lyft') ||
            merchant.includes('bus') || merchant.includes('train') || merchant.includes('airline') ||
            merchant.includes('airport')) {
            return 'transportation';
        }
        
        return 'other';
    }

    autoCategorizeMerchant(merchantName) {
        if (this.settings.autoCategorizeMerchants && merchantName.length > 2) {
            const category = this.categorizeMerchant(merchantName);
            if (category !== 'other') {
                document.getElementById('category').value = category;
            }
        }
    }

    // Form Management
    populateForm(data) {
        console.log('Populating form with:', data); // Debug log
        
        // Basic fields
        if (data.merchant) document.getElementById('merchant').value = data.merchant;
        if (data.amount) document.getElementById('amount').value = data.amount;
        if (data.date) document.getElementById('date').value = data.date;
        if (data.category) document.getElementById('category').value = data.category;
        
        // Currency handling
        if (data.currency) {
            const currencySelect = document.getElementById('currency');
            currencySelect.value = data.currency;
            this.updateCurrencyDisplay(currencySelect);
            
            // Update the selected state in the dropdown
            if (this.allCurrencyOptions) {
                this.allCurrencyOptions.forEach(option => {
                    option.classList.remove('selected');
                    if (option.dataset.value === data.currency) {
                        option.classList.add('selected');
                    }
                });
            }
        }
        
        // Payment method
        if (data.paymentMethod) {
            document.getElementById('paymentMethod').value = data.paymentMethod;
        }
        
        // Add card info to notes if detected
        if (data.cardLastFour) {
            const notesField = document.getElementById('notes');
            const cardInfo = `Card ending in ${data.cardLastFour}`;
            if (notesField.value) {
                notesField.value += ` | ${cardInfo}`;
            } else {
                notesField.value = cardInfo;
            }
        }
        
        // VAT rate
        if (data.vatRate) {
            document.getElementById('vatRate').value = data.vatRate;
        }
        
        // Project
        if (data.project) {
            document.getElementById('project').value = data.project;
        }
        
        // Notes (if not already populated with card info)
        if (data.notes && !data.cardLastFour) {
            document.getElementById('notes').value = data.notes;
        }
        
        // Show success message
        const populatedFields = Object.keys(data).filter(key => data[key] && data[key].toString().trim() !== '');
        if (populatedFields.length > 0) {
            this.showToast(`✅ Extracted ${populatedFields.length} fields: ${populatedFields.join(', ')}`, 'success');
        }
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    setDefaultCurrency() {
        const currencySelect = document.getElementById('currency');
        currencySelect.value = this.settings.defaultCurrency;
        // Update the display after setting the default
        this.updateCurrencyDisplay(currencySelect);
        
        // Also update the selected state in the dropdown
        if (this.allCurrencyOptions) {
            this.allCurrencyOptions.forEach(option => {
                option.classList.remove('selected');
                if (option.dataset.value === this.settings.defaultCurrency) {
                    option.classList.add('selected');
                }
            });
        }
    }

    clearForm() {
        // Check if form has any data to confirm clearing
        const formData = new FormData(document.getElementById('expenseForm'));
        const hasData = Array.from(formData.values()).some(value => value && value.trim() !== '') || 
                       this.attachedFiles.length > 0 || 
                       this.currentReceiptFile !== null ||
                       document.getElementById('attendeesSection').querySelectorAll('.attendee-item').length > 0;
        
        if (hasData) {
            // Show confirmation dialog
            const confirmed = confirm('⚠️ Are you sure you want to clear all form data?\n\nThis will remove:\n• All entered information\n• Attached receipts\n• Added attendees\n\nThis action cannot be undone.');
            
            if (!confirmed) {
                return; // User cancelled, don't clear the form
            }
        }
        
        document.getElementById('expenseForm').reset();
        this.setDefaultDate();
        this.setDefaultCurrency();
        this.hideReceiptPreview();
        
        // Clear attendees
        const attendeesSection = document.getElementById('attendeesSection');
        const attendeeItems = attendeesSection.querySelectorAll('.attendee-item');
        attendeeItems.forEach(item => item.remove());
        this.attendeeCounter = 0;
        
        // Clear attachments
        this.attachedFiles.forEach(attachment => {
            URL.revokeObjectURL(attachment.url);
        });
        this.attachedFiles = [];
        this.currentReceiptFile = null;
        this.updateAttachmentsDisplay();
        
        // Close camera if open
        this.closeCamera();
        
        // Show confirmation that form was cleared
        this.showToast('✅ Form cleared successfully', 'success');
    }

    // Attendee Management
    addAttendee() {
        this.attendeeCounter++;
        const attendeesSection = document.getElementById('attendeesSection');
        const addButton = document.getElementById('addAttendeeBtn');
        
        const attendeeDiv = document.createElement('div');
        attendeeDiv.className = 'attendee-item';
        attendeeDiv.setAttribute('data-attendee-id', this.attendeeCounter);
        attendeeDiv.innerHTML = `
            <div class="attendee-header" onclick="this.closest('.attendee-item').querySelector('.attendee-fields').style.display = this.closest('.attendee-item').querySelector('.attendee-fields').style.display === 'none' ? 'block' : 'none'">
                <span class="attendee-display">Attendee ${this.attendeeCounter}</span>
                <button type="button" class="remove-attendee" onclick="event.stopPropagation(); this.closest('.attendee-item').remove()">×</button>
            </div>
            <div class="attendee-fields" style="display: block;">
                <div class="attendee-input-group">
                    <input type="text" placeholder="Full Name" name="attendee-name-${this.attendeeCounter}" onchange="this.closest('.attendee-item').querySelector('.attendee-display').textContent = this.value || 'Attendee ${this.attendeeCounter}'">
                    <input type="text" placeholder="Company" name="attendee-company-${this.attendeeCounter}">
                    <input type="text" placeholder="Title/Position" name="attendee-title-${this.attendeeCounter}">
                </div>
                <button type="button" class="btn-primary attendee-save" onclick="this.closest('.attendee-fields').style.display = 'none'">Save</button>
            </div>
        `;
        
        attendeesSection.insertBefore(attendeeDiv, addButton);
    }

    // Search Merchant
    async searchMerchant() {
        const merchantName = document.getElementById('merchant').value;
        if (!merchantName) {
            this.showToast('Please enter a merchant name first', 'warning');
            return;
        }
        
        // Show loading state
        const searchButton = document.getElementById('searchMerchant');
        const originalText = searchButton.textContent;
        searchButton.textContent = '⏳';
        searchButton.disabled = true;
        
        try {
            // Simulate API search with enhanced merchant suggestions
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get enhanced merchant suggestions
            const suggestions = this.getEnhancedMerchantSuggestions(merchantName);
            this.displayMerchantSearchResults(suggestions);
            
            // Auto-categorize based on the search
            if (this.settings.autoCategorizeMerchants) {
                const category = this.categorizeMerchant(merchantName);
                document.getElementById('category').value = category;
            }
            
            this.showToast(`Found ${suggestions.length} suggestions for "${merchantName}"`, 'success');
        } catch (error) {
            console.error('Merchant search error:', error);
            this.showToast('Search failed. Please try again.', 'error');
        } finally {
            // Restore button state
            searchButton.textContent = originalText;
            searchButton.disabled = false;
        }
    }

    // Setup merchant suggestions dropdown
    setupMerchantSuggestions() {
        const merchantInput = document.getElementById('merchant');
        const merchantContainer = merchantInput.parentElement;
        
        // Create suggestions dropdown if it doesn't exist
        if (!document.getElementById('merchantSuggestions')) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.id = 'merchantSuggestions';
            suggestionsDiv.className = 'merchant-suggestions';
            suggestionsDiv.style.display = 'none';
            merchantContainer.appendChild(suggestionsDiv);
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!merchantContainer.contains(e.target)) {
                    this.hideMerchantSuggestions();
                }
            });
        }
    }

    // Get enhanced merchant suggestions
    getEnhancedMerchantSuggestions(query) {
        const commonMerchants = [
            { name: 'Amazon', category: 'Shopping', type: 'Online' },
            { name: 'Starbucks', category: 'Food & Drink', type: 'Coffee Shop' },
            { name: 'McDonald\'s', category: 'Food & Drink', type: 'Fast Food' },
            { name: 'Target', category: 'Shopping', type: 'Retail Store' },
            { name: 'Walmart', category: 'Shopping', type: 'Retail Store' },
            { name: 'Shell', category: 'Transportation', type: 'Gas Station' },
            { name: 'Uber', category: 'Transportation', type: 'Ride Share' },
            { name: 'CVS Pharmacy', category: 'Health', type: 'Pharmacy' },
            { name: 'Home Depot', category: 'Shopping', type: 'Home Improvement' },
            { name: 'Costco', category: 'Shopping', type: 'Warehouse Store' },
            { name: 'Apple Store', category: 'Technology', type: 'Electronics' },
            { name: 'Best Buy', category: 'Technology', type: 'Electronics' },
            { name: 'Subway', category: 'Food & Drink', type: 'Fast Food' },
            { name: 'Pizza Hut', category: 'Food & Drink', type: 'Restaurant' },
            { name: 'Office Depot', category: 'Business', type: 'Office Supplies' }
        ];

        // Filter merchants based on query
        const filtered = commonMerchants.filter(merchant => 
            merchant.name.toLowerCase().includes(query.toLowerCase()) ||
            merchant.category.toLowerCase().includes(query.toLowerCase()) ||
            merchant.type.toLowerCase().includes(query.toLowerCase())
        );

        // Add query as a custom option if not in results
        if (query.length > 2 && !filtered.some(m => m.name.toLowerCase() === query.toLowerCase())) {
            filtered.unshift({
                name: query,
                category: this.categorizeMerchant(query),
                type: 'Custom'
            });
        }

        return filtered.slice(0, 8); // Limit to 8 suggestions
    }

    // Show merchant suggestions
    showMerchantSuggestions(query) {
        if (!query || query.length < 2) {
            this.hideMerchantSuggestions();
            return;
        }

        const suggestions = this.getEnhancedMerchantSuggestions(query);
        const suggestionsDiv = document.getElementById('merchantSuggestions');
        
        if (suggestions.length === 0) {
            this.hideMerchantSuggestions();
            return;
        }

        suggestionsDiv.innerHTML = suggestions.map(merchant => `
            <div class="merchant-suggestion" data-name="${merchant.name}" data-category="${merchant.category}">
                <div class="merchant-name">${merchant.name}</div>
                <div class="merchant-details">${merchant.category} • ${merchant.type}</div>
            </div>
        `).join('');

        // Add click handlers
        suggestionsDiv.querySelectorAll('.merchant-suggestion').forEach(item => {
            item.addEventListener('click', () => {
                const merchantName = item.dataset.name;
                const category = item.dataset.category;
                
                document.getElementById('merchant').value = merchantName;
                if (this.settings.autoCategorizeMerchants) {
                    document.getElementById('category').value = category;
                }
                this.hideMerchantSuggestions();
            });
        });

        suggestionsDiv.style.display = 'block';
    }

    // Hide merchant suggestions
    hideMerchantSuggestions() {
        const suggestionsDiv = document.getElementById('merchantSuggestions');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }

    // Display merchant search results
    displayMerchantSearchResults(suggestions) {
        if (suggestions.length === 0) {
            this.showToast('No merchant suggestions found', 'info');
            return;
        }

        // Show the suggestions dropdown with search results
        this.showMerchantSuggestions(document.getElementById('merchant').value);
    }

    // Expense Management
    saveExpense(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const expense = {
            id: Date.now(),
            merchant: formData.get('merchant'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            currency: formData.get('currency'),
            date: formData.get('date'),
            paymentMethod: formData.get('paymentMethod'),
            paymentDetails: formData.get('paymentDetails'),
            notes: formData.get('notes'),
            costCenter: formData.get('costCenter'),
            attendees: this.getAttendees(),
            attachments: this.attachedFiles.map(att => ({
                id: att.id,
                name: att.name,
                url: att.url
            })),
            hasAttachments: this.attachedFiles.length > 0,
            createdAt: new Date().toISOString()
        };
        
        this.expenses.push(expense);
        this.saveToStorage();
        this.displayExpenses();
        this.clearForm();
        
        // Switch to expenses tab
        this.switchTab('my-expenses');
        
        alert('Expense saved successfully!');
    }

    getAttendees() {
        const attendees = [];
        const attendeeItems = document.querySelectorAll('.attendee-item');
        
        attendeeItems.forEach((item, index) => {
            const inputs = item.querySelectorAll('input');
            if (inputs[0].value || inputs[1].value || inputs[2].value) {
                attendees.push({
                    name: inputs[0].value,
                    company: inputs[1].value,
                    title: inputs[2].value
                });
            }
        });
        
        return attendees;
    }

    displayExpenses(filteredExpenses = null) {
        const expensesList = document.getElementById('expensesList');
        const expenses = filteredExpenses || this.expenses;
        
        if (expenses.length === 0) {
            expensesList.innerHTML = `
                <div class="empty-state">
                    <p>No expenses recorded yet</p>
                    <p>Start by adding your first expense!</p>
                </div>
            `;
            return;
        }
        
        expensesList.innerHTML = expenses.map(expense => `
            <div class="expense-item">
                <div class="expense-header">
                    <div class="expense-merchant">
                        ${expense.merchant}
                        ${expense.hasAttachments ? ' 📎' : ''}
                    </div>
                    <div class="expense-amount">
                        ${expense.amount.toFixed(2)}
                        <span class="currency">${expense.currency}</span>
                    </div>
                </div>
                <div class="expense-meta">
                    <div>📅 ${this.formatDateForDisplay(expense.date)}</div>
                    <div>💳 ${this.formatPaymentMethod(expense.paymentMethod)}</div>
                </div>
                <div class="expense-category">${this.formatCategory(expense.category)}</div>
                ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
                ${expense.attendees && expense.attendees.length > 0 ? `
                    <div class="expense-attendees">
                        👥 ${expense.attendees.length} attendee${expense.attendees.length > 1 ? 's' : ''}
                    </div>
                ` : ''}
                <div class="expense-actions">
                    <button class="btn-secondary" onclick="expenseApp.editExpense(${expense.id})">Edit</button>
                    <button class="btn-secondary" onclick="expenseApp.deleteExpense(${expense.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    formatPaymentMethod(method) {
        const methods = {
            'cash': 'Cash',
            'credit-card': 'Credit Card',
            'app': 'App Payment',
            'wire-transfer': 'Wire Transfer',
            'check': 'Check'
        };
        return methods[method] || method;
    }

    formatCategory(category) {
        const categories = {
            'hotel-lodging': 'Hotel & Lodging',
            'customer-meeting': 'Customer Meeting',
            'car-related': 'Car Related',
            'transportation': 'Transportation',
            'office-supplies': 'Office Supplies',
            'travel': 'Travel',
            'entertainment': 'Entertainment',
            'restaurant': 'Restaurant',
            'food': 'Food',
            'groceries': 'Groceries',
            'other': 'Other'
        };
        return categories[category] || category;
    }

    filterExpenses(category) {
        if (!category) {
            this.displayExpenses();
            return;
        }
        
        const filteredExpenses = this.expenses.filter(expense => expense.category === category);
        this.displayExpenses(filteredExpenses);
    }

    editExpense(id) {
        const expense = this.expenses.find(e => e.id === id);
        if (!expense) return;
        
        // Switch to receipt entry tab
        this.switchTab('receipt-entry');
        
        // Populate form with expense data
        document.getElementById('merchant').value = expense.merchant;
        document.getElementById('category').value = expense.category;
        document.getElementById('amount').value = expense.amount;
        document.getElementById('currency').value = expense.currency;
        document.getElementById('date').value = expense.date;
        document.getElementById('paymentMethod').value = expense.paymentMethod;
        document.getElementById('paymentDetails').value = expense.paymentDetails || '';
        document.getElementById('notes').value = expense.notes || '';
        document.getElementById('costCenter').value = expense.costCenter || '';
        
        // Add attendees
        if (expense.attendees && expense.attendees.length > 0) {
            expense.attendees.forEach(attendee => {
                this.addAttendee();
                const attendeeItem = document.querySelector('.attendee-item:last-of-type');
                const inputs = attendeeItem.querySelectorAll('input');
                inputs[0].value = attendee.name || '';
                inputs[1].value = attendee.company || '';
                inputs[2].value = attendee.title || '';
            });
        }
        
        // Remove the expense from the list (it will be re-added when saved)
        this.deleteExpense(id, false);
    }

    deleteExpense(id, showConfirmation = true) {
        if (showConfirmation && !confirm('Are you sure you want to delete this expense?')) {
            return;
        }
        
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.saveToStorage();
        this.displayExpenses();
    }

    // Export Functionality
    exportToCSV() {
        if (this.expenses.length === 0) {
            alert('No expenses to export');
            return;
        }
        
        const headers = [
            'Date', 'Merchant', 'Category', 'Amount', 'Currency', 
            'Payment Method', 'Payment Details', 'Notes', 'Cost Center', 'Attendees'
        ];
        
        const csvContent = [
            headers.join(','),
            ...this.expenses.map(expense => [
                this.formatDateForDisplay(expense.date),
                `"${expense.merchant}"`,
                `"${this.formatCategory(expense.category)}"`,
                expense.amount,
                expense.currency,
                `"${this.formatPaymentMethod(expense.paymentMethod)}"`,
                `"${expense.paymentDetails || ''}"`,
                `"${expense.notes || ''}"`,
                `"${expense.costCenter || ''}"`,
                `"${expense.attendees ? expense.attendees.map(a => `${a.name} (${a.company})`).join('; ') : ''}"`
            ].join(','))
        ].join('\n');
        
        this.downloadCSV(csvContent, 'expenses');
    }

    exportAllData() {
        const data = {
            expenses: this.expenses,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, 'expense-data.json', 'application/json');
    }

    downloadCSV(content, filename) {
        this.downloadFile(content, `${filename}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Settings Management
    loadSettings() {
        document.getElementById('defaultCurrency').value = this.settings.defaultCurrency;
        document.getElementById('autoSuggestMerchants').checked = this.settings.autoSuggestMerchants;
        document.getElementById('autoCategorizeMerchants').checked = this.settings.autoCategorizeMerchants;
        document.getElementById('dateFormat').value = this.settings.dateFormat;
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        localStorage.setItem('settings', JSON.stringify(this.settings));
        
        // Apply currency default if changed
        if (key === 'defaultCurrency') {
            this.setDefaultCurrency();
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.expenses = [];
            localStorage.removeItem('expenses');
            this.displayExpenses();
            alert('All data has been cleared');
        }
    }

    // Utility Methods
    saveToStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    // Toast notification system
    showToast(message, type = 'info') {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to body
        document.body.appendChild(toast);

        // Show toast with animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // Currency display management
    updateCurrencyDisplay(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const currencyCode = selectedOption.value;
        const fullText = selectedOption.textContent;
        
        // Extract symbol from the option text (first part before space)
        const symbol = fullText.split(' ')[0];
        
        // Update the search input display to show only symbol and code (compact)
        const currencySearch = document.getElementById('currencySearch');
        currencySearch.value = `${symbol} ${currencyCode}`;
        currencySearch.placeholder = `${symbol} ${currencyCode}`;
        
        // Store full text for dropdown display
        currencySearch.dataset.fullText = fullText;
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        overlay.querySelector('p').textContent = message;
        overlay.classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.expenseApp = new ExpenseApp();
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
