document.addEventListener('DOMContentLoaded', function() {
    const gridContainer = document.getElementById('grid-container');
    const updateButton = document.getElementById('updateButton');
    const birthdateInput = document.getElementById('birthdate');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const infoElement = document.getElementById('info');
    
    // Some years have 52 weeks + 1 or 2 days, which makes a 53rd partial week
    const YEARS_TO_DISPLAY = 100;
    
    // Check if there's a birthdate in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const birthdateFromUrl = urlParams.get('birthdate');
    
    if (birthdateFromUrl) {
        birthdateInput.value = birthdateFromUrl;
        generateLifeChart(birthdateFromUrl);
    }
    
    // Initialize the grid if no birthdate is provided
    if (!birthdateFromUrl) {
        createEmptyGrid();
    }
    
    // Handle the update button click
    updateButton.addEventListener('click', function() {
        const birthdate = birthdateInput.value;
        if (birthdate) {
            // Update the URL with the new birthdate
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('birthdate', birthdate);
            window.history.pushState({}, '', newUrl);
            
            generateLifeChart(birthdate);
        } else {
            alert('Please enter a valid birthdate.');
        }
    });
    
    // Handle the copy link button
    copyLinkButton.addEventListener('click', function() {
        const birthdate = birthdateInput.value;
        if (birthdate) {
            const url = new URL(window.location.href);
            url.searchParams.set('birthdate', birthdate);
            
            navigator.clipboard.writeText(url.href)
                .then(() => alert('Link copied to clipboard!'))
                .catch(err => console.error('Failed to copy link: ', err));
        } else {
            alert('Please enter a birthdate first.');
        }
    });
    
    function createEmptyGrid() {
        gridContainer.innerHTML = '';
        
        // Create 100 rows (years)
        for (let year = 0; year < YEARS_TO_DISPLAY; year++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            rowElement.setAttribute('data-year', year);
            
            // Standard weeks per row - we'll adjust this based on birthdate later
            const weeksPerRow = 53; // Allow for 53 weeks to accommodate leap years
            
            for (let week = 0; week < weeksPerRow; week++) {
                const boxElement = document.createElement('div');
                boxElement.className = 'box';
                boxElement.setAttribute('data-week', week);
                rowElement.appendChild(boxElement);
            }
            
            gridContainer.appendChild(rowElement);
        }
    }
    
    // Helper function to calculate age (year of life, 0-indexed)
    function calculateAge(checkDate, birthD) {
        let age = checkDate.getFullYear() - birthD.getFullYear();
        const m = checkDate.getMonth() - birthD.getMonth();
        if (m < 0 || (m === 0 && checkDate.getDate() < birthD.getDate())) {
            age--;
        }
        return age;
    }

    function generateLifeChart(birthdate) {
        // Clear the grid first
        createEmptyGrid();
        
        const birthDate = new Date(birthdate);
        birthDate.setHours(0, 0, 0, 0);
        
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        if (isNaN(birthDate.getTime()) || birthDate > currentDate) {
            infoElement.textContent = "Please enter a valid past birthdate.";
            // Clear year labels if any from previous valid run
            const rowsForLabelClear = gridContainer.querySelectorAll('.row');
            rowsForLabelClear.forEach(row => {
                const existingLabel = row.querySelector('.year-label');
                if (existingLabel) {
                    row.removeChild(existingLabel);
                }
            });
            return;
        }
        
        const weeksArray = []; 
        const upcomingWeeksArray = [];
        const millisecondsInWeek = 7 * 24 * 60 * 60 * 1000;

        // Calculate weeks lived
        let iterDateLived = new Date(birthDate);
        iterDateLived.setDate(iterDateLived.getDate() - iterDateLived.getDay()); // Align to Sunday of birth week

        while (iterDateLived <= currentDate) {
            const age = calculateAge(iterDateLived, birthDate);
            if (age >= 0) {
                const NthBirthday = new Date(birthDate);
                NthBirthday.setFullYear(birthDate.getFullYear() + age);
                const startOfWeekOfNthBirthday = new Date(NthBirthday);
                startOfWeekOfNthBirthday.setDate(NthBirthday.getDate() - NthBirthday.getDay());
                const weekOfYear = Math.floor((iterDateLived - startOfWeekOfNthBirthday) / millisecondsInWeek);

                if (weekOfYear >= 0 && age < YEARS_TO_DISPLAY) { // Ensure age is within grid bounds
                    weeksArray.push({
                        date: new Date(iterDateLived),
                        yearOfLife: age,
                        weekOfYear: weekOfYear
                    });
                }
            }
            iterDateLived.setDate(iterDateLived.getDate() + 7);
        }
        
        // Calculate next birthday
        let nextBirthdayYearCalc = currentDate.getFullYear();
        if (currentDate.getMonth() > birthDate.getMonth() || 
            (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() >= birthDate.getDate())) {
            nextBirthdayYearCalc++;
        }
        const nextBirthday = new Date(nextBirthdayYearCalc, birthDate.getMonth(), birthDate.getDate());
        
        // Calculate upcoming weeks until next birthday
        let iterDateUpcoming = new Date(currentDate);
        if (iterDateUpcoming.getDay() !== 0) {
             iterDateUpcoming.setDate(iterDateUpcoming.getDate() + (7 - iterDateUpcoming.getDay()));
        } else {
            const lastLivedWeek = weeksArray.length > 0 ? weeksArray[weeksArray.length-1] : null;
            if (lastLivedWeek && lastLivedWeek.date.getTime() === iterDateUpcoming.getTime()){
                iterDateUpcoming.setDate(iterDateUpcoming.getDate() + 7); // Start from next week if current Sunday already counted
            }
        }

        while (iterDateUpcoming < nextBirthday && iterDateUpcoming >= currentDate) {
            const age = calculateAge(iterDateUpcoming, birthDate);
            if (age >= 0) {
                const NthBirthday = new Date(birthDate);
                NthBirthday.setFullYear(birthDate.getFullYear() + age);
                const startOfWeekOfNthBirthday = new Date(NthBirthday);
                startOfWeekOfNthBirthday.setDate(NthBirthday.getDate() - NthBirthday.getDay());
                const weekOfYear = Math.floor((iterDateUpcoming - startOfWeekOfNthBirthday) / millisecondsInWeek);
                
                if (weekOfYear >= 0 && age < YEARS_TO_DISPLAY) { // Ensure age is within grid bounds
                    upcomingWeeksArray.push({
                        date: new Date(iterDateUpcoming),
                        yearOfLife: age,
                        weekOfYear: weekOfYear
                    });
                }
            }
            iterDateUpcoming.setDate(iterDateUpcoming.getDate() + 7);
        }
        
        const weeksLivedCount = weeksArray.length;
        const actualYearsLived = weeksArray.length > 0 ? Math.max(0, ...weeksArray.map(w => w.yearOfLife)) : 0;
        const weeksInCurrentYearLived = weeksArray.length > 0 ? weeksArray.filter(w => w.yearOfLife === actualYearsLived).length : 0;
        const weeksUntilBirthdayCount = upcomingWeeksArray.length;
        
        const formattedBirthDate = birthDate.toLocaleDateString();
        const formattedCurrentDate = currentDate.toLocaleDateString();
        const formattedNextBirthday = nextBirthday.toLocaleDateString();
        
        if (weeksLivedCount > 0) {
            infoElement.textContent = `From ${formattedBirthDate} to ${formattedCurrentDate}, you have lived ${actualYearsLived} years and ${weeksInCurrentYearLived} weeks (${weeksLivedCount} weeks total). ${weeksUntilBirthdayCount} weeks until your next birthday on ${formattedNextBirthday}.`;
        } else if (birthDate <= currentDate) { // Born today or in the past, but no full weeks lived yet by this logic
             infoElement.textContent = `Born on ${formattedBirthDate}. Chart shows weeks starting from the Sunday of your birth week. ${weeksUntilBirthdayCount} weeks until your next birthday on ${formattedNextBirthday}.`;
        } else { // Should be caught by the initial check, but as a fallback
            infoElement.textContent = "Chart is for past birthdates.";
        }
        
        const rows = gridContainer.querySelectorAll('.row');
        
        weeksArray.forEach(week => {
            if (typeof week.yearOfLife === 'number' && week.yearOfLife >= 0 && week.yearOfLife < rows.length) {
                const rowElement = rows[week.yearOfLife];
                if (rowElement && typeof week.weekOfYear === 'number' && week.weekOfYear >= 0) {
                    const boxes = rowElement.querySelectorAll('.box');
                    if (week.weekOfYear < boxes.length) {
                        boxes[week.weekOfYear].classList.add('filled');
                    }
                }
            }
        });
        
        upcomingWeeksArray.forEach(week => {
            if (typeof week.yearOfLife === 'number' && week.yearOfLife >= 0 && week.yearOfLife < rows.length) {
                const rowElement = rows[week.yearOfLife];
                if (rowElement && typeof week.weekOfYear === 'number' && week.weekOfYear >= 0) {
                    const boxes = rowElement.querySelectorAll('.box');
                    if (week.weekOfYear < boxes.length) {
                        boxes[week.weekOfYear].classList.add('upcoming-birthday');
                    }
                }
            }
        });
        
        const allYearsInvolved = [...new Set([...weeksArray, ...upcomingWeeksArray].map(w => w.yearOfLife))];
        const maxYearToLabel = allYearsInvolved.length > 0 ? Math.max(...allYearsInvolved) : -1;

        rows.forEach((row, index) => {
            const existingLabel = row.querySelector('.year-label');
            if (existingLabel) {
                row.removeChild(existingLabel);
            }
            if (index <= maxYearToLabel && index < YEARS_TO_DISPLAY) {
                const yearLabel = document.createElement('div');
                yearLabel.className = 'year-label';
                yearLabel.textContent = index + 1; 
                row.insertBefore(yearLabel, row.firstChild);
            }
        });
    }
});
