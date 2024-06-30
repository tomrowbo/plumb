import { NextRequest, NextResponse } from "next/server";
import { Connex } from "@vechain/connex";
import { mintB3tr } from "@/utils/mintB3tr";


export async function POST(request: NextRequest) {
  try {
    const amount = request.nextUrl.searchParams.get('amount');
    const address = request.nextUrl.searchParams.get('address');
    await mintB3tr(address!!, amount!!);


    return NextResponse.json({ success: true });
    }
    catch (error: any) {
        console.log(error);
        return NextResponse.json({ success: false, error: error.message });
    }
}


