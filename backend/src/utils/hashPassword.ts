import bcrypt from "bcrypt"

const hashPassowrd = async (password: string,rounds:number=10):Promise<string> => {
    const saltRounds = rounds
 const hashedPassword = await bcrypt.hash(password, saltRounds);
 return hashedPassword;
}


const verifyPassword=async(password:string, hashedPassword:string):Promise<boolean>=>{
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
}

export {hashPassowrd, verifyPassword}