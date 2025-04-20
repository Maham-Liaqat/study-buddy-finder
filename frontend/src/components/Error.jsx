import React from 'react';

   const Error = ({ message }) => {
     if (!message) return null;
     return (
       <div className="bg-red-500 text-white p-4 rounded-lg mb-4 text-center">
         {message}
       </div>
     );
   };

   export default Error;