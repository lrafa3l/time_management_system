document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate password match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Send data to the back-end
    try {
        const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST', // Change method to POST
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome: name, email: email, senha: password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Account created successfully!');
            window.location.href = './auth.html'; // Redirect to login page
        } else {
            alert(data.error || 'Failed to create account');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});