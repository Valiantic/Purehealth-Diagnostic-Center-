import { useMemo } from 'react'

const useUserDisplay = (user) => {
  const userDisplayData = useMemo(() => {
    if(!user) {
        return {
            displayName: 'Beta User',
            initials: 'Dev',
            firstName: '',
            lastName: '',
            shortName: 'Beta User'
        };
    }

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const middleName = user.middleName || '';

    const getDisplayName = () => {
        if(firstName && lastName) {
            return `${firstName} ${lastName}`
        }

        if(firstName) return firstName;
        if(lastName) return lastName;

        return user.email || user.username || 'Beta User';
    }

    const getFullName = () => {
        return [firstName, middleName, lastName].filter(Boolean).join(' ');
    };

    const getShortName = () => {
        if (firstName) return firstName;
        if (lastName) return lastName;
        return getDisplayName();
    }

     const getInitials = () => {
      const firstInitial = firstName.charAt(0).toUpperCase();
      const lastInitial = lastName.charAt(0).toUpperCase();
      
      if (firstInitial && lastInitial) {
        return firstInitial + lastInitial;
      }
      
      if (firstInitial) return firstInitial + 'U';
      if (lastInitial) return 'U' + lastInitial;
      
      return 'U';
    };

    return {
      displayName: getDisplayName(),
      fullName: getFullName(),
      shortName: getShortName(),
      initials: getInitials(),
      firstName,
      lastName,
      middleName
    };

  }, [user]);

  return userDisplayData;
}

export default useUserDisplay
