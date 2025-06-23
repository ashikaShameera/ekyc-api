import { getConnection } from '../config/db.js';

/**
 * Returns { email, mobile } or null if not found.
 * Feel free to tweak the SQL to match your real data source.
 */
export async function getEmail(idType, idValue, institutionCode) {
    // Here need to get customer email and phone number from the blockchain
    if (idType == "NIC" && idValue == "1" && institutionCode =="INS001") {
        return {
            email: "ashikashameera@gmail.com",
            mobile: "0777973793" // Mobile as string to preserve leading 0
        };
    }

    // Optional: Return null or throw error if no match found
    return null;
}

export async function getEkycUserData(params) {
    
}
